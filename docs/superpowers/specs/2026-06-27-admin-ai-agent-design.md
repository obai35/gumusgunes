# Admin AI Agent — Autonomous Agent Design

**Date:** 2026-06-27
**Status:** Draft

## Overview

Transform the admin AI assistant from a simple Q&A chatbot into a full autonomous agent that can explore the codebase, inspect the database, run shell commands, edit files, and execute git/tests — all from the admin panel sidebar.

## Architecture

### Approach: Backend Agent Loop (Approach 1)

Single `POST /api/admin/chat` endpoint acts as an autonomous agent loop:

```
User Message → Backend → LLM decides tools → Execute safe tools automatically →
  Feed tool results back to LLM for reasoning →
  If dangerous tools needed → Return pendingActions to frontend →
  User approves → Execute approved actions → Return final response
```

### Data Flow

1. Frontend sends `POST { message, history }` to `/api/admin/chat`
2. Backend builds system prompt + tool definitions + current store stats
3. Calls Groq (`llama-3.3-70b-versatile`) with function-calling enabled
4. Groq responds with tool calls, direct reply, or both
5. Safe tool calls → execute immediately → feed results back to LLM for another reasoning pass
6. Dangerous tool calls → return as `pendingActions[]` in response, stop the loop
7. Frontend shows approval buttons → user clicks Approve or Reject
8. On approve: `POST /api/admin/chat/approve { sessionId, actionIndex }` → backend executes → returns final reply
9. On reject: backend resumes loop, telling LLM the action was rejected

### Session Management

- In-memory `Map<sessionId, { history, pendingActions, toolResults }>`
- Session created on first request per page load
- Expires after 30 minutes of inactivity
- `sessionId` generated via `crypto.randomUUID()`

## Tool Definitions

### Safe Tools (auto-execute)

| Tool | Signature | Description |
|------|-----------|-------------|
| `readFile` | `(path: string) → string` | Read file contents |
| `searchCode` | `(query: string, path?: string) → { file, line, content }[]` | Grep/glob search |
| `readDir` | `(path: string) → string[]` | List directory entries |
| `readLog` | `(lines?: number) → string` | Tail server log |
| `dbQuery` | `(query: string) → any[]` | Read-only SQL via Prisma |
| `listApiRoutes` | `() → string[]` | List all API endpoint paths |
| `listDbModels` | `() → { name, fields }[]` | List Prisma models |
| `getSystemInfo` | `() → { uptime, memory, node, platform }` | System info |
| `gitStatus` | `() → string` | Read-only `git status` |
| `gitDiff` | `() → string` | Read-only `git diff` |

### Dangerous Tools (require approval)

| Tool | Signature | Description |
|------|-----------|-------------|
| `writeFile` | `(path: string, content: string) → string` | Create or overwrite file |
| `editFile` | `(path: string, oldString: string, newString: string) → string` | Find-and-replace in file |
| `runCommand` | `(command: string) → { stdout, stderr, exitCode }` | Execute shell command |
| `gitCommit` | `(message: string) → string` | Stage all + commit |
| `gitPush` | `() → string` | `git push` |
| `restartServer` | `() → string` | Restart Node process |
| `runTests` | `(pattern?: string) → { stdout, stderr, exitCode }` | Run tests |
| `runLint` | `() → { stdout, stderr, exitCode }` | Run linter |

## Backend Implementation

### File: `src/app/api/admin/chat/route.ts`

Major rewrite of the existing route:

```typescript
// New route structure:
// POST /api/admin/chat — main agent endpoint
// POST /api/admin/chat/approve — approve/reject a pending action

// Tool definitions sent to LLM as function definitions
const tools = [
  {
    type: 'function',
    function: {
      name: 'readFile',
      description: 'Read file contents from the project',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path from project root' }
        },
        required: ['path']
      }
    }
  },
  // ... more tools
]
```

### Tool Execution

- Safe tools: `executeTool(name, args)` returns `{ success, data }` or `{ success: false, error }`
- Dangerous tools: not executed — stored as `pendingAction` with a description for the user
- Tool results are fed back as a new message with `role: 'tool'`

### Security

- All file operations constrained to project directory (resolve paths against `process.cwd()`)
- Command execution: 15-second timeout, 10MB output limit, no interactive commands
- SQL queries: only `SELECT` statements allowed (checked via regex)
- Rate limit: 10 requests per 60 seconds per session
- All dangerous actions require admin authentication (already handled by existing auth)

## Frontend Implementation

### File: `src/components/admin/AdminChat.tsx`

**Changes from current version:**

1. **Message rendering**: Detect code blocks (`` ```language ... ``` ``) and render as styled `<pre><code>`

2. **Action approval UI**: When response includes `pendingActions`, show each action with:
   - Action description (what the agent wants to do)
   - [Approve] [Reject] buttons per action or batch
   - On approve: send approval to backend, show spinner while executing
   - On reject: send rejection, agent continues with alternative approach

3. **Status messages**: Show inline status for tool execution ("Reading file...", "Running command...", etc.)

4. **API changes**:
   - Send `POST /api/admin/chat` with `{ message, history }`
   - If `pendingActions` returned, show approval UI
   - Send `POST /api/admin/chat/approve` with `{ sessionId, actionIndex, approved }`
   - Receive final reply

### State Updates

```typescript
type PendingAction = {
  index: number
  tool: string
  description: string
  args: Record<string, any>
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  pendingActions?: PendingAction[]
}
```

## System Prompt

Updated admin system prompt to include:
- Agent's role as an autonomous admin assistant
- List of all available tools with descriptions
- Instructions: always explain what you're doing before using a tool
- Instructions: for dangerous actions, explain what you'll do and why
- Store context (admin panel sections, tech stack, database models)
- Language rules (English + Arabic)

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/admin/chat/route.ts` | Major rewrite — agent loop, tool definitions, Groq function calling, session management |
| `src/app/api/admin/chat/approve/route.ts` | New — approve/reject pending actions, execute approved tools, return final reply |
| `src/components/admin/AdminChat.tsx` | Enhanced UI — code blocks, approval buttons, status indicators |

## Future Considerations (out of scope)

- Persistent conversation history (database-backed)
- File diff preview before applying edits
- Undo functionality for changes
- WebSocket streaming for real-time tool execution output
