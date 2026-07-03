import { NextResponse } from 'next/server'
import { logger } from './logger'

export function handleApiError(error: unknown, context: string): NextResponse {
  logger.error({ context, error }, 'API error')
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
