import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from './logger'

export type ApiError = {
  error: string
  details?: any
  code?: string
}

export function handleApiError(err: unknown, context?: string): NextResponse {
  if (context) {
    logger.error({ context, err }, 'API error')
  }

  if (err instanceof ZodError) {
    return NextResponse.json({
      error: 'Validation failed',
      details: err.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
      code: 'VALIDATION_ERROR',
    }, { status: 400 })
  }

  if (err instanceof Error) {
    const status =
      err.message === 'Unauthorized' ? 401 :
      err.message === 'Forbidden' ? 403 :
      err.message.toLowerCase().includes('not found') ? 404 :
      err.message.toLowerCase().includes('already exists') ? 409 :
      err.message.toLowerCase().includes('rate limit') ? 429 :
      500

    return NextResponse.json({
      error: err.message,
      code: status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
    }, { status })
  }

  return NextResponse.json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  }, { status: 500 })
}
