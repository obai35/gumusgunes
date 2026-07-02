import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getOrCreateSession, clearPendingActions } from '@/lib/admin-chat-session'
import { executeTool } from '@/lib/admin-chat-tools'

const approveHandler = async (req: NextRequest, ctx: { params: any }) => {
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

export const POST = withAdmin(approveHandler, 'chat')
