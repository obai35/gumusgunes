# White-Label E-Commerce Platform — Implementation Plan

**Location:** `C:\Users\obai\Desktop\white-label-store`
**Stack:** Next.js 16 (App Router) + Prisma + PostgreSQL + Zustand + Tailwind CSS + TypeScript
**Goal:** A sellable, fully generic e-commerce platform with zero brand traces.

## Architecture Differences from Gümüş Güneş

| Aspect | Current (Branded) | New (Generic) |
|--------|-------------------|---------------|
| Brand name | Hardcoded everywhere | `config.ts` + env `NEXT_PUBLIC_STORE_NAME` |
| Color scheme | Gold/navy/silver | CSS variables in admin settings |
| Currency | EGP fixed | Configurable (USD default), multi-currency |
| Languages | ar + en hardcoded | Configurable locale list |
| Shipping zones | Egyptian governorates hardcoded | Configurable zones/regions |
| Tax | None | Configurable tax rate |
| Product categories | Jewelry-specific defaults | Empty, client creates their own |
| API keys | Hardcoded in some places | All via `.env` + `.env.example` |
| Social AI prompts | Brand-specific | Generic tone selector only |
| POS offline | Egyptian-specific | Fully generic |
| Git history | Full of personal commits | Fresh repo, no history |
| i18n translations | Arabic-heavy | English-first, translatable |
| Auth | 3 separate systems | Simplified to 2 (admin + customer) |

## Phase Breakdown

### Phase 1: Project Scaffolding + Config System
- Initialize Next.js project with TypeScript, Tailwind, App Router
- Set up Prisma with PostgreSQL
- Create `src/lib/config.ts` — all brand settings in one place
- Create `.env.example` with all required env vars documented
- Create branding CSS variables system (default: clean blue/gray theme)
- Create demo/mock mode toggle for development without APIs

### Phase 2: Core E-Commerce
- Prisma models: Product, Category, Review, Order, OrderItem, Cart (or cart via Zustand)
- Product listing page with filters, search, sorting
- Product detail page with images, reviews
- Cart (Zustand + localStorage)
- Checkout flow
- Payment integrations (Stripe, PayPal) via env vars

### Phase 3: Customer Accounts + Auth
- Customer registration, login, forgot/reset password
- Customer JWT auth
- Account dashboard (profile, addresses, orders)
- Wishlist

### Phase 4: Admin Panel
- Admin auth (email/password + optional 2FA)
- Dashboard with revenue chart, orders, low stock alerts
- Products CRUD
- Orders management
- Categories management
- Discounts/coupons
- Shipping zones + rules
- Inventory management
- Branding settings (colors, store name, logo URL)
- Activity log

### Phase 5: POS System
- Cashier login (branch-based)
- Product search + barcode
- Cart with quantity controls
- Multiple payment methods (cash, card, split)
- Discounts
- Shift management (start/close)
- Orders history + returns
- Offline support (IndexedDB)
- Receipt printing

### Phase 6: Social Media Manager
- Connect Instagram/Facebook accounts
- Create + schedule posts
- AI content generation (generic prompts, client sets their own brand voice)
- Analytics dashboard
- Campaign engine

### Phase 7: Setup Wizard + Documentation
- First-run setup wizard (store name, admin account, currency, locale)
- README with full installation guide
- Deployment guide (Vercel, Railway, self-hosted)
- Clean git repo with no personal history
- Demo products seeder script
- Stripe/PayPal test mode documentation
