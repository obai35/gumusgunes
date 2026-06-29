# Admin AI Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the admin AI chat into an autonomous agent that can read/search/edit files, run commands, query the DB, and execute git/tests — all with approval for dangerous actions.

**Architecture:** Backend agent loop: Groq function calling decides tool calls → safe tools auto-execute → dangerous tools queue for frontend approval → approved actions execute and return results.

**Tech Stack:** Next.js 16, Groq API (llama-3.3-70b-versatile), Prisma, Node.js `child_process`, `fs/promises`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/admin-chat-session.ts` | **Create** — In-memory session store (Map with expiry) |
| `src/app/api/admin/chat/route.ts` | **Modify** — Agent loop: tool definitions, Groq function calling, safe tool execution, pending actions queue |
| `src/app/api/admin/chat/approve/route.ts` | **Create** — Approve/reject endpoint: execute approved tool, return final LLM response |
| `src/components/admin/AdminChat.tsx` | **Modify** — Approval buttons, code block rendering, session ID management |

---

### Task 1: Create session management module

**Files:**
- Create: `src/lib/admin-chat-session.ts`

- [ ] **Step 1: Write the session module**

```typescript
import { randomUUID } from 'crypto'

type PendingAction = {
  index: number
  tool: string
  description: string
  args: Record<string, any>
}

type Session = {
  id: string
  history: any[]
  pendingActions: PendingAction[]
  createdAt: number
  lastActivity: number
}

const sessions = new Map<string, Session>()
const SESSION_TTL = 30 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL) sessions.delete(id)
  }
}, 60_000)

export function getOrCreateSession(sessionId?: string): Session {
  if (sessionId && sessions.has(sessionId)) {
    const s = sessions.get(sessionId)!
    s.lastActivity = Date.now()
    return s
  }
  const session: Session = {
    id: randomUUID(),
    history: [],
    pendingActions: [],
    toolResults: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }
  sessions.set(session.id, session)
  return session
}

export function clearPendingActions(sessionId: string) {
  const s = sessions.get(sessionId)
  if (s) s.pendingActions = []
}

export type { PendingAction, Session }
```

- [ ] **Step 2: Verify module compiles**

Run server and check for compilation errors.

---

### Task 2: Create the approve endpoint

**Files:**
- Create: `src/app/api/admin/chat/approve/route.ts`

- [ ] **Step 1: Write the approve/reject endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession, clearPendingActions } from '@/lib/admin-chat-session'
import { executeTool } from '@/lib/admin-chat-tools'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, actionIndex, approved } = await req.json()
    if (!sessionId || actionIndex === undefined || approved === undefined) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }

    const session = getOrCreateSession(sessionId)
    const action = session.pendingActions[actionIndex]
    if (!action) {
      return NextResponse.json({ ok: false, error: 'Action not found or expired' }, { status: 400 })
    }

    if (!approved) {
      clearPendingActions(sessionId)
      session.history.push({ role: 'system', content: `The admin rejected the action "${action.description}". Try a different approach or explain why it's needed.` })
      return NextResponse.json({ ok: true, reply: null, rejected: true })
    }

    const result = await executeTool(action.tool, action.args)
    const toolResultMsg = {
      role: 'tool' as const,
      tool_call_id: `approve_${actionIndex}`,
      content: JSON.stringify(result),
    }

    clearPendingActions(sessionId)

    const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'AI not configured' }, { status: 500 })
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [...session.history, toolResultMsg],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (groqRes.ok) {
      const data = await groqRes.json()
      const reply = data.choices?.[0]?.message?.content || 'Action executed. What would you like to do next?'
      session.history.push({ role: 'assistant', content: reply })
      return NextResponse.json({ ok: true, reply, sessionId: session.id })
    }

    return NextResponse.json({ ok: true, reply: 'Action executed. What would you like to do next?' })
  } catch (e) {
    console.error('Approve error:', e)
    return NextResponse.json({ ok: false, error: 'Failed to process approval' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create the tools executor library**

Create: `src/lib/admin-chat-tools.ts`

```typescript
import { exec } from 'child_process'
import { readFile, readdir, writeFile } from 'fs/promises'
import { db } from '@/lib/db'
import { glob } from 'glob'
import path from 'path'

const PROJECT_ROOT = process.cwd()
const MAX_OUTPUT = 10 * 1024 * 1024

function safePath(p: string): string {
  const resolved = path.resolve(PROJECT_ROOT, p)
  if (!resolved.startsWith(PROJECT_ROOT)) throw new Error('Path outside project directory')
  return resolved
}

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'readFile': {
      const content = await readFile(safePath(args.path), 'utf-8')
      return { content }
    }
    case 'searchCode': {
      const { execSync } = require('child_process')
      try {
        const result = execSync(`rg -n "${args.query}"${args.path ? ` ${args.path}` : ' --type ts --type tsx --type css'}`, {
          cwd: PROJECT_ROOT,
          maxBuffer: MAX_OUTPUT,
          encoding: 'utf-8',
          timeout: 10000,
        })
        return { results: result.split('\n').filter(Boolean).slice(0, 100) }
      } catch {
        return { results: [] }
      }
    }
    case 'readDir': {
      const entries = await readdir(safePath(args.path), { withFileTypes: true })
      return { entries: entries.map(e => ({ name: e.name, isDirectory: e.isDirectory() })) }
    }
    case 'readLog': {
      const { execSync } = require('child_process')
      const lines = args.lines || 50
      try {
        const result = execSync(`tail -n ${lines} server.log`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5000 })
        return { content: result }
      } catch {
        return { content: 'Could not read server.log' }
      }
    }
    case 'dbQuery': {
      const query = String(args.query).trim().toLowerCase()
      if (!/^select\b/.test(query)) throw new Error('Only SELECT queries are allowed')
      const result = await db.$queryRawUnsafe(args.query)
      return { rows: result }
    }
    case 'listApiRoutes': {
      const { globSync } = require('glob')
      const routes = globSync('src/app/api/**/route.ts', { cwd: PROJECT_ROOT })
      return { routes: routes.map(r => r.replace(/^src\/app\/api\//, '/api/').replace(/\/route\.ts$/, '')) }
    }
    case 'listDbModels': {
      const modelNames = Object.keys(db).filter(k => k.startsWith('_') === false && typeof (db as any)[k]?.findMany === 'function')
      return { models: modelNames }
    }
    case 'getSystemInfo': {
      return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
        platform: process.platform,
        cwd: PROJECT_ROOT,
      }
    }
    case 'gitStatus': {
      const { execSync } = require('child_process')
      return { output: execSync('git status', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }) }
    }
    case 'gitDiff': {
      const { execSync } = require('child_process')
      return { output: execSync('git diff', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }) }
    }
    case 'writeFile': {
      await writeFile(safePath(args.path), args.content, 'utf-8')
      return { status: 'written', path: args.path }
    }
    case 'editFile': {
      const current = await readFile(safePath(args.path), 'utf-8')
      if (!current.includes(args.oldString)) throw new Error('oldString not found in file')
      const updated = current.replace(args.oldString, args.newString)
      await writeFile(safePath(args.path), updated, 'utf-8')
      return { status: 'edited', path: args.path }
    }
    case 'runCommand': {
      return new Promise((resolve) => {
        exec(args.command, { cwd: PROJECT_ROOT, timeout: 15000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    case 'gitCommit': {
      const { execSync } = require('child_process')
      execSync('git add -A', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 })
      const result = execSync(`git commit -m "${args.message.replace(/"/g, '\\"')}"`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 })
      return { output: result }
    }
    case 'gitPush': {
      const { execSync } = require('child_process')
      const result = execSync('git push', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 })
      return { output: result }
    }
    case 'restartServer': {
      setTimeout(() => process.exit(0), 1000)
      return { status: 'restarting' }
    }
    case 'runTests': {
      return new Promise((resolve) => {
        exec(`npm test ${args.pattern || ''}`, { cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    case 'runLint': {
      return new Promise((resolve) => {
        exec('npm run lint', { cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

const SAFE_TOOLS = new Set(['readFile', 'searchCode', 'readDir', 'readLog', 'dbQuery', 'listApiRoutes', 'listDbModels', 'getSystemInfo', 'gitStatus', 'gitDiff'])

export function isToolSafe(name: string): boolean {
  return SAFE_TOOLS.has(name)
}
```

---

### Task 3: Rewrite the main chat route

**Files:**
- Modify: `src/app/api/admin/chat/route.ts`

- [ ] **Step 1: Write the new agent loop route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateSession } from '@/lib/admin-chat-session'
import { executeTool, isToolSafe } from '@/lib/admin-chat-tools'

const ADMIN_PROMPT = `You are the Gümüş Güneş Admin Assistant — an autonomous AI agent with access to the full system.

You have tools available to help you help the admin. For each request:
1. First, think about what information you need
2. Use safe tools automatically to gather info
3. Explain what you're doing before each action
4. For dangerous actions (writing files, running commands, etc.), explain what you need to do and why — these will be sent for admin approval

Available tools:
- readFile(path): Read any file in the project
- searchCode(query): Search codebase by pattern
- readDir(path): List directory contents
- readLog(lines?): Read server log
- dbQuery(sql): Run SELECT queries on the database
- listApiRoutes(): List all API endpoints
- listDbModels(): List database models and fields
- getSystemInfo(): Server info (uptime, memory, Node version)
- gitStatus(): Check git status
- gitDiff(): View uncommitted changes
- writeFile(path, content): Create or overwrite a file (requires approval)
- editFile(path, oldString, newString): Edit a file (requires approval)
- runCommand(command): Run a shell command (requires approval)
- gitCommit(message): Commit all changes (requires approval)
- gitPush(): Push to remote (requires approval)
- runTests(pattern?): Run tests (requires approval)
- runLint(): Run linter (requires approval)
- restartServer(): Restart the dev server (requires approval)

Admin panel knowledge:
- Dashboard, Orders, Products, Inventory, Discounts, Branches, POS, Site Editor, Security, Settings
- Built with Next.js 16, Prisma ORM, SQLite, Tailwind CSS
- Tech stack listed in package.json

Language rules:
- Understand casual English and casual Arabic (Egyptian, Levantine, Gulf, MSA)
- Respond in the same language the user uses
- Be professional but friendly`

const TOOL_DEFINITIONS = [
  { type: 'function', function: { name: 'readFile', description: 'Read file contents from the project', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'searchCode', description: 'Search codebase by pattern', parameters: { type: 'object', properties: { query: { type: 'string' }, path: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'readDir', description: 'List directory contents', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } },
  { type: 'function', function: { name: 'readLog', description: 'Read server log (last N lines)', parameters: { type: 'object', properties: { lines: { type: 'number' } } } } },
  { type: 'function', function: { name: 'dbQuery', description: 'Run a SELECT SQL query on the database', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'listApiRoutes', description: 'List all API endpoints', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'listDbModels', description: 'List database models and their fields', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'getSystemInfo', description: 'Get server system info', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'gitStatus', description: 'Show git working tree status', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'gitDiff', description: 'Show uncommitted changes', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'writeFile', description: 'Create or overwrite a file (requires admin approval)', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'editFile', description: 'Find and replace in a file (requires admin approval)', parameters: { type: 'object', properties: { path: { type: 'string' }, oldString: { type: 'string' }, newString: { type: 'string' } }, required: ['path', 'oldString', 'newString'] } } },
  { type: 'function', function: { name: 'runCommand', description: 'Execute a shell command (requires admin approval)', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
  { type: 'function', function: { name: 'gitCommit', description: 'Stage all and commit (requires admin approval)', parameters: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } } },
  { type: 'function', function: { name: 'gitPush', description: 'Push commits to remote (requires admin approval)', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'runTests', description: 'Run the test suite (requires admin approval)', parameters: { type: 'object', properties: { pattern: { type: 'string' } } } } },
  { type: 'function', function: { name: 'runLint', description: 'Run the linter (requires admin approval)', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'restartServer', description: 'Restart the dev server (requires admin approval)', parameters: { type: 'object', properties: {} } } },
]

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], sessionId: clientSessionId } = await req.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: true, reply: 'AI is not configured. Ask the developer to set GROQ_API_KEY in .env' })
    }

    const session = getOrCreateSession(clientSessionId)
    session.history = [...session.history.slice(-20), ...history, { role: 'user', content: message }]

    const orderCount = await db.order.count().catch(() => 0)
    const productCount = await db.product.count({ where: { isActive: true } }).catch(() => 0)
    const systemContent = `${ADMIN_PROMPT}\n\nCurrent stats: ${orderCount} orders, ${productCount} active products.`

    const maxLoop = 5
    for (let loop = 0; loop < maxLoop; loop++) {
      const groqMessages = [
        { role: 'system', content: systemContent },
        ...session.history,
      ]

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          tools: TOOL_DEFINITIONS,
          tool_choice: 'auto',
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!groqRes.ok) {
        const errText = await groqRes.text().catch(() => 'Unknown error')
        return NextResponse.json({ ok: true, reply: `AI service error: ${errText}` })
      }

      const data = await groqRes.json()
      const choice = data.choices?.[0]?.message
      if (!choice) {
        return NextResponse.json({ ok: true, reply: 'I could not process that request. Please try rephrasing.' })
      }

      const content = choice.content || ''
      const toolCalls = choice.tool_calls || []

      if (toolCalls.length === 0) {
        session.history.push({ role: 'assistant', content })
        return NextResponse.json({
          ok: true,
          reply: content,
          sessionId: session.id,
          pendingActions: [],
        })
      }

      const assistantMsg: any = { role: 'assistant', content }
      assistantMsg.tool_calls = toolCalls.map((tc: any) => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.function.name, arguments: tc.function.arguments },
      }))
      session.history.push(assistantMsg)

      const pendingActions: any[] = []

      for (const tc of toolCalls) {
        const name = tc.function.name
        const args = JSON.parse(tc.function.arguments || '{}')

        if (isToolSafe(name)) {
          try {
            const result = await executeTool(name, args)
            session.history.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            })
          } catch (err: any) {
            session.history.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify({ error: err.message }),
            })
          }
        } else {
          const descriptions: Record<string, string> = {
            writeFile: `Write file: ${args.path}`,
            editFile: `Edit file: ${args.path}`,
            runCommand: `Run command: ${args.command}`,
            gitCommit: `Git commit: ${args.message}`,
            gitPush: 'Push to remote',
            runTests: args.pattern ? `Run tests: ${args.pattern}` : 'Run all tests',
            runLint: 'Run linter',
            restartServer: 'Restart dev server',
          }
          pendingActions.push({
            index: pendingActions.length,
            tool: name,
            description: descriptions[name] || name,
            args,
          })
        }
      }

      if (pendingActions.length > 0) {
        session.pendingActions = pendingActions
        return NextResponse.json({
          ok: true,
          reply: content || `I need your approval to proceed with ${pendingActions.length} action(s).`,
          sessionId: session.id,
          pendingActions,
        })
      }
    }

    session.history.push({ role: 'assistant', content: 'I completed the analysis. What would you like to do next?' })
    return NextResponse.json({ ok: true, reply: 'I completed the analysis. What would you like to do next?' })
  } catch (e) {
    console.error('Admin chat agent error:', e)
    return NextResponse.json({ ok: true, reply: 'An error occurred. Please try again.' })
  }
}
```

- [ ] **Step 2: Remove old tools executor import references from the route** (already handled — tools are in a separate file)

---

### Task 4: Update AdminChat.tsx — approval UI + code blocks

**Files:**
- Modify: `src/components/admin/AdminChat.tsx`

- [ ] **Step 1: Update the component with session management, approval buttons, and code block rendering**

```typescript
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Sparkles, ChevronDown, ChevronRight, Bot, Check, X, AlertTriangle, Terminal, FileCode, Database } from 'lucide-react'

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

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(?:\w+)?\n?([\s\S]*?)```/)
      const code = match ? match[1] : part.slice(3, -3)
      return (
        <pre key={i} className="text-xs bg-navy-deep/90 text-green-400 p-2 rounded-lg overflow-x-auto my-1.5 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      )
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>
  })
}

function getToolIcon(tool: string) {
  switch (tool) {
    case 'readFile':
    case 'writeFile':
    case 'editFile': return <FileCode className="h-3 w-3" />
    case 'runCommand': return <Terminal className="h-3 w-3" />
    case 'dbQuery': return <Database className="h-3 w-3" />
    default: return <AlertTriangle className="h-3 w-3" />
  }
}

export function AdminChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Hello! I am your admin assistant. How can I help you manage the store?' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: [],
          sessionId,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply || '' }
        if (data.pendingActions?.length > 0) {
          assistantMsg.pendingActions = data.pendingActions
        }
        setMessages(prev => [...prev, assistantMsg])
        if (data.sessionId) setSessionId(data.sessionId)
        if (!data.pendingActions?.length && data.reply) {
          scrollToBottom()
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your network and try again.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId])

  const handleApproval = useCallback(async (actionIndex: number, approved: boolean, messageIndex: number) => {
    if (!sessionId) return
    setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, pendingActions: undefined } : m))
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chat/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, actionIndex, approved }),
      })
      const data = await res.json()
      if (data.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else if (data.ok && data.rejected) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Action rejected. You can ask the agent to try a different approach.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to process approval.' }])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  function scrollToBottom() {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }
    }, 50)
  }

  return (
    <div className="border-t border-silver/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Bot className="h-4 w-4 text-gold" />
        <span className="font-medium">AI Assistant</span>
        {!open && messages.length > 1 && (
          <span className="ml-auto h-2 w-2 rounded-full bg-gold animate-pulse" />
        )}
      </button>

      {open && (
        <div className="flex flex-col" style={{ height: '320px' }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-gold" />
                    </div>
                  )}
                  <div
                    className={`text-xs leading-relaxed px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-gold/10 text-silver'
                        : 'bg-silver/5 text-silver/80'
                    }`}
                  >
                    {renderContent(m.content)}
                  </div>
                </div>

                {m.pendingActions && m.pendingActions.length > 0 && (
                  <div className="mt-1.5 ml-8 space-y-1">
                    {m.pendingActions.map((action) => (
                      <div key={action.index} className="flex items-center justify-between bg-navy-soft/30 rounded-lg px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-silver/70">
                          {getToolIcon(action.tool)}
                          <span>{action.description}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproval(action.index, true, i)}
                            disabled={loading}
                            className="h-5 w-5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 flex items-center justify-center disabled:opacity-30"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleApproval(action.index, false, i)}
                            disabled={loading}
                            className="h-5 w-5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center disabled:opacity-30"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-gold" />
                </div>
                <div className="bg-silver/5 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); send(input) }}
            className="px-2 pb-2 pt-1 flex items-center gap-1 flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-navy-soft/50 rounded-lg px-2.5 py-1.5 text-xs text-silver placeholder:text-silver/30 outline-none focus:ring-1 focus:ring-gold/40 border border-silver/10"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-7 w-7 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center disabled:opacity-30 transition-colors flex-shrink-0"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
```

---

### Task 5: Verify everything compiles

**Files:** N/A

- [ ] **Step 1: Kill existing server and restart**

```bash
Get-Process -Name "node" | Stop-Process -Force; Start-Sleep 3
```

```bash
npm run dev -- --webpack
```

Wait 20 seconds, then visit `/admin/pos` and verify no hydration errors. Visit `/admin` and test the AI assistant.

- [ ] **Step 2: Test the agent**

1. Open admin panel → click AI Assistant in sidebar
2. Ask: "Show me what files are in the src directory" → should auto-execute `readDir` and show results
3. Ask: "What's the database schema?" → should auto-execute `listDbModels` and show models
4. Ask: "Can you fix a bug?" → should try to use tools and may request approval for dangerous actions
