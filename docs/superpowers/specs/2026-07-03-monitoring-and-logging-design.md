# Monitoring & Logging Design

Date: 2026-07-03

## Overview

Add structured logging, request monitoring, and error tracking using Better Stack (formerly Logtail) with Pino.

## 1. Structured Logging

Install `@logtail/pino` — a Pino transport that streams JSON logs directly to Better Stack.

Create `src/lib/logger.ts`:
```typescript
import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? {
        target: '@logtail/pino',
        options: { sourceToken: process.env.BETTER_STACK_SOURCE_TOKEN },
      }
    : {
        target: 'pino-pretty',
        options: { colorize: true },
      },
})
```

- Production: logs ship to Better Stack via `@logtail/pino`
- Development: logs print to console with `pino-pretty` (colorized, readable)

## 2. API Request Logging

Create `src/lib/request-logger.ts` — a helper to log API requests:

```typescript
import { logger } from './logger'

export function logRequest(req: Request, status: number, durationMs: number, context?: string) {
  const url = new URL(req.url)
  const logData = {
    method: req.method,
    path: url.pathname,
    query: url.search,
    status,
    durationMs,
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent'),
    context,
  }

  if (status >= 500) logger.error(logData, 'Server error')
  else if (durationMs > 1000) logger.warn(logData, 'Slow request')
  else logger.info(logData, 'Request')
}
```

## 3. Integration with API Routes

Add logging calls to these existing paths:

- `src/lib/api-error.ts` — replace `console.error` with `logger.error`
- `src/lib/rate-limit.ts` — replace `console.warn` with `logger.warn`
- `src/lib/audit.ts` — replace `console.error` with `logger.error`
- All API route catch blocks — use `logger.error` in addition to `handleApiError`

## 4. Better Stack Uptime Monitoring

- The existing `GET /api` health check returns `{ message: "Hello, world!" }`
- Add a Better Stack heartbeat ping: `GET /api/health`
- Configure 3 uptime monitors in Better Stack dashboard:
  1. Production: `https://gumusgunes.vercel.app/api/health`
  2. Custom domain
  3. Preview (auto-deploy URLs)

## 5. Environment Variables

```
BETTER_STACK_SOURCE_TOKEN=your_token
LOG_LEVEL=info
```

## Files Changed

| File | Change |
|---|---|
| `src/lib/logger.ts` | Create — shared Pino logger (Better Stack in prod, pretty in dev) |
| `src/lib/request-logger.ts` | Create — API request logging helper |
| `src/app/api/health/route.ts` | Create — health check endpoint with Better Stack heartbeat |
| `src/lib/api-error.ts` | Replace `console.error` → `logger.error` |
| `src/lib/rate-limit.ts` | Replace `console.warn` → `logger.warn` |
| `src/lib/audit.ts` | Replace `console.error` → `logger.error` |
| `package.json` | Add `@logtail/pino`, `pino`, `pino-pretty` deps |
| `.env.example` | Add `BETTER_STACK_SOURCE_TOKEN`, `LOG_LEVEL` |
