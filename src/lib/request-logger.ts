import { logger } from './logger'

export function logRequest(req: Request, status: number, durationMs: number, context?: string) {
  const url = new URL(req.url)
  const logData: Record<string, unknown> = {
    method: req.method,
    path: url.pathname,
    query: url.search,
    status,
    durationMs,
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent'),
    context,
  }

  if (status >= 500) {
    logger.error(logData, 'Server error')
  } else if (durationMs > 1000) {
    logger.warn(logData, 'Slow request')
  } else {
    logger.info(logData, 'Request')
  }
}
