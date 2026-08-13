---
date: 2026-08-13
topic: scale-security-rbac-foundations
---

# Scale, Security, Admin Platform, and SEO/AEO Foundations

## Summary

A four-phase, zero-budget program that hardens security across the storefront, admin panel, and POS; adds real multi-device admin sessions (including POS) with a role system that scales to hundreds of roles (global catalog + per-store customization); lays caching, pooling, write-path, and observability foundations so "millions of visitors and orders" becomes a config flip later instead of a rewrite; and makes the storefront visible to search engines and AI assistants (SEO/AEO) so the traffic those foundations are built for can actually arrive. Nothing in this program requires spending money now, though Vercel Pro is a planned near-term flip (pending decision, see R20).

---

## Problem Frame

The platform is live and multi-tenant (every core model is `storeId`-scoped), but today it runs on free-tier infrastructure with hard ceilings: Vercel Hobby (≈1M function invocations/month, 4 CPU-hours, 360 GB-hours, 100 GB bandwidth — and, per Vercel's terms, **personal/non-commercial use only**, which a live revenue store already strains), Neon Postgres free tier, and no rate-limiting service configured. A live audit already found real security gaps: rate limiting is silently skipped on Vercel, the POS keeps its auth token in localStorage (XSS-exposed), page-level security headers were removed in uncommitted local work, and the admin login endpoint was returning 500s in production (now fixed). The owner expects millions of visitors *and* transactional users, an admin panel supporting hundreds of roles across stores, and access from many devices — all while the platform is security-first across every surface. Without foundations, each of those ambitions fails at first contact with real traffic: brute force, a stolen POS token, or a single-store role model that cannot express platform-wide teams.

On the visibility side the storefront already has solid SEO plumbing — `sitemap.ts` (static + products + categories), `robots.ts`, per-page metadata, and JSON-LD (Product + BreadcrumbList on products; Organization + WebSite in the root layout) — but it is incomplete: no `llms.txt`, no AI-crawler policy in robots.txt, no Open Graph/Twitter images, blog posts absent from the sitemap, cart/checkout pages listed in the sitemap (should be noindex), and no Search Console or AI-citation measurement.

---

## Actors

- A1. Storefront customer: browses, creates account, checks out, returns
- A2. Platform operator (super admin): owns all stores, the global role catalog, and platform settings
- A3. Store admin/team member: manages a single store under a role assigned per store
- A4. POS operator: rings sales at a physical branch on a tablet/PC
- A5. Threat actor: targets login, tokens, and admin/POS APIs
- A6. Search engine / AI assistant crawler: indexes storefront pages and quotes them in search results and AI answers

---

## Key Flows

- F1. Secure admin login
  - **Trigger:** Platform operator or store admin visits `/admin/login`
  - **Actors:** A2, A3, A5
  - **Steps:** Enter email/password → rate limiter and lockout checks pass (failed 2FA codes count toward lockout too) → password verified → 2FA if the role requires it → signed JWT in httpOnly cookie → session record created with device metadata → success redirected to `/admin`
  - **Outcome:** Only valid, un-locked, 2FA-cleared sessions reach the panel; failed attempts (password and 2FA) are audited and throttled
  - **Covered by:** R1, R2, R3, R4, R5, R6
- F2. Multi-device session management
  - **Trigger:** Admin opens the session list, or a device is lost/stolen
  - **Actors:** A2, A3
  - **Steps:** List all active sessions (device, location, last activity) → select one → revoke it → that device's token is invalidated immediately while all other sessions stay live
  - **Outcome:** Revoking one device never logs out the others; every session is attributable to a device; "revoke all" keeps the current device signed in and kills every other device
  - **Covered by:** R7, R8, R9, R10
- F3. Role assignment across stores
  - **Trigger:** Platform operator creates a role or assigns an admin to a store
  - **Actors:** A2, A3
  - **Steps:** Pick a global role template or a per-store role → set granular permissions from the catalog → assign admin → admin's API access is enforced against that permission set on every admin route
  - **Outcome:** Hundreds of roles are manageable; permissions are enforced deny-by-default on every admin API route
  - **Covered by:** R12, R13, R14, R15
- F4. POS device session
  - **Trigger:** POS operator logs in at a branch terminal
  - **Actors:** A4, A5
  - **Steps:** Login with credentials → token issued in httpOnly cookie (not localStorage) → session record created and tied to the admin and branch → logout or revoke clears it server-side via the same token-version mechanism as admin sessions
  - **Outcome:** POS auth uses the same hardened cookie/session model as admin — including server-side revocation; localStorage has no credentials to steal; a revoked POS token is dead immediately, not valid for its remaining 24h
  - **Covered by:** R1, R2, R3, R11
- F5. Storefront discoverability (SEO/AEO)
  - **Trigger:** Search engines and AI assistants request the storefront or its machine-readable surfaces
  - **Actors:** A1, A6
  - **Steps:** Crawler hits sitemap/robots → indexable pages serve unique metadata, valid structured data, crawlable content, and for AI assistants an `llms.txt` plus a clean, task-completable page flow (browse → product → cart → checkout)
  - **Outcome:** Product/category/blog pages are indexable and citable; the site answers AI queries with accurate, structured, up-to-date content; core shopping tasks are completable by AI agents
  - **Covered by:** R21, R22, R23, R24, R25

---

## Requirements

**Phase 1 — Security hardening (all surfaces)**

- R1. Every auth endpoint (admin login, admin 2FA, customer login, customer 2FA, POS login) is rate-limited in production. Behavior must be explicit: when the rate-limit service is **unconfigured**, production logs a loud warning and rate limiting is skipped (deliberate fail-open, documented); when it is **configured but erroring**, requests fail closed (429) rather than passing through unthrottled
- R2. All login/token endpoints return security cookies (httpOnly, secure, sameSite) and never expose tokens in client-accessible storage (localStorage/sessionStorage)
- R3. Page-level security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) apply to all storefront, admin, and POS pages consistently (currently removed in local work — restore to a single source of truth)
- R4. Account lockout and failed-attempt audit work on every login surface (admin already has it; customer and POS must too), with lockout thresholds and durations that match the existing admin model. **Failed 2FA code attempts also increment the failed-attempt counter** (today they do not)
- R5. 2FA is enforced for platform operators and any role flagged privileged (finance, super admin); optional for others. The flow includes enrollment (TOTP secret + QR), backup codes, and recovery (reset via email verification); privileged admins may be force-enrolled
- R6. A security audit pass covers all three surfaces: CSRF coverage on state-changing routes, authz checks on admin/POS APIs, secrets handling (pepper/JWT secrets set and validated at boot), and CSP permissiveness

**Phase 2 — Multi-device admin sessions (incl. POS) + scalable RBAC**

- R7. Admin sessions become first-class records (device name, IP, user agent, last activity) instead of stateless JWTs only
- R8. One admin can be signed in on many devices simultaneously; each session is individually revocable without affecting others
- R9. Session-management UI in the admin panel: view active sessions, revoke any single session, revoke all sessions for a user. **Revoke-all keeps the current session alive and kills every other device** (the device where the operator clicked stays signed in)
- R10. Password change or forced-logout invalidates that user's sessions (token-version style, per-session where feasible)
- R11. POS logins join the same session model: server-side session record, per-session revocability, and logout/revoke that invalidates the POS token immediately (explicitly replacing today's stateless 24h JWT with no revocation)
- R12. Role system supports a global role catalog (platform-level templates) plus per-store roles with per-store assignments, so hundreds of roles across many stores are expressible
- R13. Permissions are a structured catalog (not freeform JSON), versioned, and enforced deny-by-default on every admin API route
- R14. Role-management UI: create, clone, edit, archive roles; assign admins; view role→admin mapping
- R15. Admin and role listing pages paginate and stay fast at hundreds of roles and thousands of admins (indexed, scoped by store)

**Phase 3 — Scale foundations (reads, writes, ops)**

- R16. Storefront read paths (product, category, homepage, search) are cached (ISR/revalidate) so most page views never hit the database, **with an explicit invalidation strategy** for price and stock changes (revalidate on product/stock/price mutations, not just TTL)
- R17. Neon connection pooling is validated and tuned (your URL is already pooled; verify pool size/limits and Prisma config)
- R18. Observability: error logging with context, audit log retention policy, and the existing logging stack wired through
- R19. The order **write path** is foundation-ready for spikes: batch/queue-friendly order creation at checkout, idempotent payment webhooks, indexed order queries, and a documented strategy for handling order bursts without 5xx
- R20. Scale-readiness checklist documents the exact config flips (paid tiers — including **Vercel Pro as a planned near-term flip** given Hobby's non-commercial-use terms, pool sizing, cache strategies) to execute when traffic thresholds are hit, so going big is a deployment decision, not an engineering project

**Phase 4 — SEO & AEO (visibility)**

- R21. Indexing hygiene: sitemap completeness (include blog posts; correct `lastmod`), robots.txt correctness (AI-crawler policy included, see R23), canonical tags on all canonically-reachable pages, and **noindex** on transactional/account pages (cart, checkout, account, admin-adjacent pages) — removed from the sitemap
- R22. Rich metadata + structured data: unique title/description per page (products, categories, blog), Open Graph + Twitter cards with absolute 1200×630 image URLs, valid JSON-LD (Product/Offer with price+availability, BreadcrumbList, Organization, WebSite, FAQ where applicable) — validated in a rich-results/Search Console pass
- R23. AI engine optimization (AEO): an `llms.txt` serving accurate, current store info; an explicit AI-crawler policy in robots.txt (which AI agents may index); semantic, crawlable HTML with clean markdown availability for AI consumers; and core shopping tasks (browse → product → cart → checkout) completable by AI agents
- R24. Content-registry pattern for scale: unique per-page metadata generated from product/category/blog data (no duplicate titles), heading hierarchy, internal linking, and E-E-A-T signals — the pattern that keeps 50–500 pages distinct and crawlable
- R25. Measurement: Search Console verification + sitemap submission, scheduled checks of AI-citation behavior (where/if the brand appears in AI answers), and a quarterly AEO/SEO audit

---

## Acceptance Examples

- AE1. **Covers R1, R4.** Given Upstash configured, when a user submits the 6th admin login attempt inside 30 seconds, they receive 429 with Retry-After; when 10 failed attempts accumulate (including failed 2FA codes), the account is locked for 15 minutes and a failed-login audit entry is written for each attempt.
- AE2. **Covers R2.** Given a POS terminal, when the operator logs in and the page reloads, no credential-bearing value appears in localStorage or sessionStorage; the browser's devtools cookie panel shows an httpOnly `__session_pos`-style cookie.
- AE3. **Covers R8, R9.** Given an admin signed in on a phone and a laptop, when they revoke the phone session from the session list, the laptop session still works and API calls with the phone's token return 401; clicking "revoke all" keeps the laptop signed in and logs out the phone.
- AE4. **Covers R13.** Given a store admin with role permissions excluding "delete product", when they POST to an admin delete-product route, the request is rejected by the authorization layer before reaching the handler.
- AE5. **Covers R16.** Given a warm cache, when 10,000 anonymous visitors open the same product page in an hour, the database receives near-zero product queries for that page; a price change revalidates within the documented window.
- AE6. **Covers R19.** Given an order spike simulating 100 checkouts in a minute (plus payment-webhook replays), order creation and webhooks complete without 5xx and no order is created twice (idempotency proven).
- AE7. **Covers R23.** An AI crawler fetches `llms.txt` and returns accurate store info; a headless agent can browse from homepage to a product to cart to checkout start without HTML that blocks it (no auth walls, no missing schema).
- AE8. **Covers R25.** Search Console shows the sitemap accepted and no critical coverage errors; a quarterly run lists the queries/pages where the brand appears in AI answers.

---

## Success Criteria

- Every finding from the Phase 1 security audit is fixed or has a documented, dated exception
- All three login surfaces (storefront, admin, POS) are rate-limited, lockout-protected (2FA failures included), and audit-logged in production
- An admin can be signed in on multiple devices, see the session list, and revoke one device (or all devices except the current one) without ambiguity
- POS sessions are genuinely revocable server-side (no 24h stale-token window)
- Platform operator can create hundreds of roles across stores from a global catalog plus per-store roles, with deny-by-default enforcement verified on admin routes
- Storefront page views mostly served from cache; DB load per page view near zero on hot paths; the order write path survives a simulated burst without 5xx or duplicates
- SEO/AEO: sitemap/robots/metadata/structured-data pass Google's rich-results and Search Console checks; `llms.txt` and AI-crawler policy live; a headless agent can complete browse→product→cart→checkout; first AI-citation measurement exists
- Total infrastructure spend remains $0 until the Pro flip in R20 is triggered; every change ships on current free tiers, and the scale-readiness checklist is complete enough that planning can cost the flip out in an afternoon

---

## Scope Boundaries

### Deferred for later

- Paid infrastructure (Upstash paid, Neon paid tier, Vercel Pro/Enterprise) — the checklist in R20 triggers these; Vercel Pro is flagged as a planned near-term decision due to Hobby's non-commercial terms, but is not purchased in this program
- Million-scale load testing — cannot be validated honestly at zero budget without real traffic; covered by the checklist instead
- Customer-facing 2FA as a default requirement for all shoppers (out of scope; R5 covers privileged admin roles only)
- POS offline mode / local queueing — separate feature domain
- Paid SEO/AEO tooling (Screaming Frog tiers, paid citation trackers) — measurement in R25 is manual/free-tier first

### Outside this product's identity

- Platform rewrite or migration to a different runtime/hosting model (e.g., Cloudflare Workers, Turso) to chase free scale — the current stack is kept; scale is achieved through paid-tier flips on the existing stack
- A public SaaS marketplace for external merchants to self-serve store creation — multi-tenancy exists, but merchant self-onboarding is not this program
- SEO content campaigns (blog article production, link building) — R24 builds the pattern; the content itself is a separate effort

---

## Key Decisions

- **Phased, security-first:** Security (Phase 1) precedes sessions/RBAC (Phase 2) and scale (Phase 3) because each gap found live (rate limiting off, POS token in localStorage, 2FA lockout bypass) is a direct, currently-exploitable risk
- **Zero budget now (with a flagged flip):** Foundations are code-and-config only; Vercel Pro flip is documented in R20 as planned because Hobby limits are tight *and* its terms allow personal/non-commercial use only (user-confirmed)
- **Roles = global catalog + per-store:** "Hundreds of roles" means platform templates AND per-store roles, because the tenant model is per-store but teams span stores (user-confirmed)
- **Scale target = visitors AND transactions:** Both organic traffic and accounts/orders must be foundation-ready; the free-tier ceiling on both is accepted until paid flips (user-confirmed)
- **Rate limiting: fail-open when unconfigured, fail-closed when erroring:** The current code skips throttling when unconfigured (keep, but log loudly) and returns 429 on Redis errors (keep — this is the secure behavior; the doc now says so explicitly)
- **POS is part of sessions, not a special case:** POS tokens join the Phase 2 session/token-version model so "revoke" is real and immediate (user-confirmed)
- **Revoke-all keeps the current session alive:** matches standard admin-tool behavior (Slack/Google-style) (user-confirmed)
- **SEO/AEO is a first-class phase:** visibility work is zero-cost, uses only existing Next.js primitives, and directly feeds the traffic the scale foundations exist for (user-confirmed)

---

## Dependencies / Assumptions

- Upstash Redis free tier availability (rate limiting) — must be verified at planning; the code path exists and skips when unconfigured. Note: Upstash free (~10K commands/day) is likely too small for per-request rate limiting on auth endpoints — R1 targets auth endpoints only, and planning must size expected usage before committing
- Neon free tier connection pool behavior — the pooled URL is in use; pool size limits verified at planning
- Vercel Hobby limits are the known ceiling for Phase 3 (≈1M invocations/month, 4 CPU-hours, 360 GB-hours, 100 GB bandwidth); Pro flip documented in R20 as a planned near-term decision
- The existing `Store`-scoped data model stays; no schema-wide refactor is part of this program (POS session records are an additive model, not a refactor)
- Admin RBAC, lockout, and audit primitives already exist in `src/lib/admin-auth.ts`, `src/lib/admin-permissions.ts`, and `prisma/schema.prisma` (Role/Admin/ActivityLog) and are extended, not rebuilt
- SEO primitives already exist (`src/app/sitemap.ts`, `src/app/robots.ts`, per-page metadata, JSON-LD in `src/app/layout.tsx` and `src/app/products/[id]/page.tsx`) and are extended, not rebuilt

---

## Outstanding Questions

### Resolve Before Planning

- [Affects R1][Needs research] Which free-tier rate-limiting service is available and acceptable for production auth endpoints (Upstash free vs. an alternative)? The code targets Upstash today, and the free quota may be too small — sizing numbers needed.

### Deferred to Planning

- [Affects R7][Technical] Session record schema: new `AdminSession` model vs. extending the JWT with a `jti` claim — planning picks based on revoke-latency requirements
- [Affects R13][Technical] Permission catalog shape: permission codes list vs. resource-action matrix — planning decides representation, scope is the deny-by-default contract
- [Affects R5][Needs research] Which roles count as "privileged" for mandatory 2FA — planning proposes the initial set, operator confirms
- [Affects R16][Needs research] Which storefront routes get ISR vs. runtime cache — depends on data volatility per route, validated during planning
- [Affects R23][Needs research] AI-crawler policy: which agents to allow (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) vs. block — the store should be AI-citable, so the default is permissive-but-monitored; planner confirms the allowlist