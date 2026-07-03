# Monitoring & Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured logging (Pino + Better Stack), API request monitoring, and health checks.

**Architecture:** Shared Pino logger with Better Stack transport in production, pretty-print in dev. Log all API requests, errors, and slow operations. Simple health-check endpoint for uptime monitoring.

**Tech Stack:** Pino, @logtail/pino, pino-pretty, Better Stack

---

### Task 1: Install Dependencies & Create Logger

**Files:**
- Create: `src/lib/logger.ts`

- [ ] **Step 1: Install packages**

```bash
cd C:\Users\obai\Desktop\website
bun add pino @logtail/pino pino-pretty
```

- [ ] **Step 2: Create the logger**

```typescript
// src/lib/logger.ts
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

- [ ] **Step 3: Verify it works**

```bash
cd C:\Users\obai\Desktop\website
bun -e "const { logger } = require('./src/lib/logger'); logger.info('test'); console.log('OK')"
```

- [ ] **Step 4: Commit**

```bash
cd C:\Users\obai\Desktop\website
git add src/lib/logger.ts package.json bun.lock
git commit -m "feat: add structured logger (Pino + Better Stack)"
```

---

### Task 2: Create Request Logger Helper

**Files:**
- Create: `src/lib/request-logger.ts`

- [ ] **Step 1: Create the request logger**

```typescript
// src/lib/request-logger.ts
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

  if (status >= 500) {
    logger.error(logData, 'Server error')
  } else if (durationMs > 1000) {
    logger.warn(logData, 'Slow request')
  } else {
    logger.info(logData, 'Request')
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd C:\Users\obai\Desktop\website
git add src/lib/request-logger.ts
git commit -m "feat: add request logging helper"
```

---

### Task 3: Create Health Check Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create the health check route**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
```

- [ ] **Step 2: Verify it works**

```bash
cd C:\Users\obai\Desktop\website
bun run dev &
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"...","uptime":...}`

- [ ] **Step 3: Commit**

```bash
cd C:\Users\obai\Desktop\website
git add src/app/api/health/route.ts
git commit -m "feat: add health check endpoint"
```

---

### Task 4: Replace console.error with Logger

**Files:**
- Modify: `src/lib/api-error.ts`
- Modify: `src/lib/rate-limit.ts`
- Modify: `src/lib/audit.ts`

- [ ] **Step 1: Update api-error.ts**

```typescript
import { NextResponse } from 'next/server'
import { logger } from './logger'

export function handleApiError(error: unknown, context: string): NextResponse {
  logger.error({ context, error }, 'API error')
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

- [ ] **Step 2: Update rate-limit.ts**

Find `console.warn('[rate-limit] Unavailable:', err)` and replace with:
```typescript
logger.warn({ err }, 'Rate limit unavailable')
```

- [ ] **Step 3: Update audit.ts**

Find `console.error('[audit] Failed to log:', error)` and replace with:
```typescript
logger.error({ error }, 'Audit log failed')
```

- [ ] **Step 4: Verify build**

```bash
cd C:\Users\obai\Desktop\website
bun run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
cd C:\Users\obai\Desktop\website
git add src/lib/api-error.ts src/lib/rate-limit.ts src/lib/audit.ts
git commit -m "feat: replace console calls with structured logger"
```

---

### Task 5: Update .env.example & Finalize

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update .env.example**

Add to `.env.example`:
```env
# Monitoring
BETTER_STACK_SOURCE_TOKEN=your_better_stack_source_token
LOG_LEVEL=info
```

- [ ] **Step 2: Run tests**

```bash
cd C:\Users\obai\Desktop\website
bun run test
```

- [ ] **Step 3: Commit & push**

```bash
cd C:\Users\obai\Desktop\website
git add .env.example
git commit -m "chore: add monitoring env vars to example"
git push origin main
```
