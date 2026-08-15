# Session Progress (2026-08-14 → ongoing)

Read this on session start to restore context. Everything below is committed and pushed to `main` unless marked otherwise.

## Status: PLAN COMPLETE — production green

The security-hardening + SEO/AEO plan (`docs/plans/2026-08-13-001-feat-security-hardening-seo-aeo-plan.md`) is fully executed — U1–U10 all `- [x]`. All 70 vitest tests pass, `tsc --noEmit` clean, `next build` clean, `playwright` aeo suite 3/3, live production verified.

## Main branch (latest first)

- `3863311` — infra: Vercel Cron for `/api/cron/send-scheduled-reports` (daily 00:00 UTC); route follows `Authorization: Bearer $CRON_SECRET` convention (Vercel auto-injects). Verified via `vercel cron ls`.
- `406aa77` — **deploy fix** (see below): pin `next@16.1.3` exact, exclude `apps` from root tsconfig, `/* turbopackIgnore: true */` in admin-chat-tools.
- `8137048` — U10: content registry `src/lib/seo.ts` (+16 tests), pages refactored to it, measurement runbook `docs/brainstorms/2026-08-13-seo-aeo-measurement-runbook.md`.
- `8aa1a33` — U9: `public/llms.txt`, per-agent robots policy (`src/app/robots.ts`), `e2e/aeo.spec.ts`.
- `81b7356` — U8: OG/Twitter brand cards, dynamic product OG image, store-driven `priceCurrency`, BlogPosting + FAQPage JSON-LD.
- `c034e6f` — U7: sitemap rewrite, noindex on transactional/auth pages, canonicals, stale `public/robots.txt` deleted.
- `f33e1b4` — U5+U6: headers single-source, boot-time env validation, R6 audit runbook appendix.
- `1721ff8` / `a1c887c` / `3d722c9` / `2b77b88` / `a34a687` — U1–U4 security: admin 2FA + backup codes, POS auth hardening, rate limiting, headers/CSRF/cron auth consolidation.

## Deploy failure root cause (fixed in `406aa77`) — do not regress

All 7 deploys since U6 errored on Vercel while local builds passed. Four compounding causes:

1. **Next version drift**: package.json had `^16.1.1`; Vercel's `npm install` picked up 16.3.0, whose `output: standalone` nft-tracing crashes on Vercel (`ENOENT .next/next-server.js.nft.json`). **Pin is now exact `"next": "16.1.3"`.** Keep it exact — do NOT use `^`.
2. **Monorepo typecheck sweep**: root tsconfig `include: **/*.ts(x)` pulled in `apps/admin-mobile` (Expo). Locally its own `node_modules` resolves react-native; on Vercel it doesn't → TS2307. **`apps` is now in tsconfig `exclude`.**
3. **Whole-project tracing**: `src/lib/admin-chat-tools.ts` dynamic `path.resolve(process.cwd(), …)` made Turbopack trace the entire project incl. `public/` → size limit. **`/* turbopackIgnore: true */` comment added** on that resolve — keep it if the file changes.
4. **Missing `CRON_SECRET`** in Vercel Production env → would crash the runtime boot gate (`validateEnvAtBoot`, fail-fast when `NODE_ENV=production && VERCEL_ENV=production`). **Added via `vercel env add`** (encrypted, Production only). Value is NOT in the repo — only in Vercel. If a new Vercel project/env is created, re-add it.

## Runtime verification (after final deploy, all green)

- `/`, `/products`, `/blog`, `/faq`, `/about`, `/sitemap.xml`, `/opengraph-image`, `/twitter-image` → 200
- `/api/cron/send-scheduled-reports` → 401 without/wrong bearer (correct)
- `/api/csp-report` → 400 on malformed payload (validates, no crash)

## Verification commands

- `npx vitest run` — 70 tests, 7 files (incl. `src/lib/seo.test.ts`, `env-check.test.ts`, backup-codes, lockout)
- `npx tsc --noEmit`
- `npx next build` (Next 16.1.3 pinned; must stay clean)
- `npx playwright test e2e/aeo.spec.ts` — 3 tests (llms.txt shape, robots per-agent, guest cart/checkout no auth wall). Playwright webServer = `bun run dev` on :3000; kill stale listeners on port 3000 before re-runs (`Get-NetTCPConnection -LocalPort 3000 -State Listen | Stop-Process`).
- Deploy: `npx vercel deploy --prod --yes` (CLI authed as `obai35`); check `vercel ls` / `vercel cron ls`.

## Gotchas (Windows/PowerShell 5.1)

- No `rg` binary — use `Select-String`/grep tool. `Get-Content -Raw` can mangle UTF-8 — prefer `[System.IO.File]::ReadAllText`.
- `[System.Security.Cryptography.RandomNumberGenerator]::Fill` does NOT exist in PS 5.1 — use `New-Object System.Security.Cryptography.RNGCryptoServiceProvider` + `GetBytes`.
- `Set-Content -Encoding utf8` writes a BOM — it broke `package.json` JSON parsing once. Use `UTF8Encoding($false)` for JSON.
- Zombie `node .next\standalone\server.js` processes lock `.next` → `next build` fails `EBUSY rmdir .next/standalone`. Kill by command line: `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'standalone' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`.
- To run the built app locally: `node .next\standalone\server.js` with `PORT=...`; `next start` does NOT work with `output: standalone`.
- DB creds live in `.env` (not `.env.local`; `.env.local` only has VERCEL_OIDC_TOKEN). Fresh DB: store=1, admin=1, products/categories/blog/orders=0 — sitemap correctly shows 15 static URLs.
- Repo rule (AGENTS.md): commit + push after every fix, one commit per plan unit.

## Candidate next steps (not started)

- GitHub Actions CI running `npx playwright test e2e/aeo.spec.ts` (only `db-backup.yml` exists in workflows)
- Capture the deploy-fix chain as a durable solution doc (ce:compound / docs/solutions) — the 4-cause story is worth recording so it never recurs
- Seed catalog data (products/categories/blog) — DB is empty; U9/U10 assertions tolerate it, but real content is needed for Search Console value
- WebMCP / `.well-known/ucp.json` — documented as future (Chromium-only), not built
