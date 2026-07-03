import { NextResponse } from 'next/server'

export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[${context}]`, error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
