import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { withRateLimit } from '@/lib/rate-limit'
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

const chatHandler = async (req: NextRequest, ctx: { params: any }) => {
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

export const POST = withRateLimit(withAdmin(chatHandler, 'chat'), { limit: 20, window: '60s' })
