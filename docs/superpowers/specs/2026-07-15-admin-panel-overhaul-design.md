# Admin Panel Overhaul — Master Design

**Goal:** Transform the admin panel into a truly comprehensive e-commerce management system by expanding the site editor, deepening accounting features, and adding marketing, operations, reporting, and system management capabilities.

**Architecture:** Each section is an independent sub-project. Sections build on existing admin patterns (sidebar nav, API routes with `withAdmin`, Prisma models, React client components). New sections get their own route under `src/app/admin/` and `src/app/api/admin/`. The site editor follows the existing `EditorToolbar` + `SectionPanel` pattern.

**Build Order (recommended):**
1. Site Editor Expansion
2. Accounting Deep-Dive
3. Marketing & Sales
4. Content Management
5. Customer Management
6. Operations
7. Reporting & Analytics
8. System Administration
9. UI/UX Polish
10. Internationalization

---

## 1. Site Editor Expansion

5 new editable sections in the visual site editor (`/admin/editor`):

### Trust Badges
- Configurable badges: Secure Checkout, SSL, Money-Back Guarantee, Free Shipping, etc.
- Upload custom badge icons, reorder, toggle visibility
- Settings key: `trustBadges`

### About Section
- Rich text for about us content
- Upload team photos, edit stats (years, products sold, customers)
- Mission/vision text fields
- Settings key: `aboutSection`

### Craftsmanship Timeline
- Add/edit timeline entries: year, title, description, optional image
- Reorderable list
- Settings key: `craftsmanshipTimeline`

### Testimonials
- Add/edit testimonials: name, role, photo, quote, rating (1-5)
- Reorderable, toggle active/inactive
- Settings key: `testimonials`

### Rewards Section
- Loyalty display config: points per EGP, tier names/thresholds, benefits per tier
- Reward catalog (items customers can redeem points for)
- Settings key: `rewardsSection`

---

## 2. Accounting Deep-Dive

### Profit & Loss Statement
- New tab: income - expenses = net P&L
- Period selector, month-by-month comparison
- API: `GET /api/admin/accounting/pl`

### Balance Sheet
- New tab: assets = liabilities + equity at a point in time
- Computed from account balances with date filter
- API: `GET /api/admin/accounting/balance-sheet`

### Audit Logging
- Wire `logAudit()` into: expense create/delete, order fulfill/reconcile, payment verify/reject, journal sync
- Audit Log tab in accounting with filters

### Charts (Recharts)
- Replace inline SVG RevenueChart with Recharts library
- Revenue trend line, expense donut, payment bar, branch comparison

### AR/AP Aging
- Accounts Receivable: unreconciled paid orders in 30/60/90+ buckets
- Accounts Payable: unpaid supplier invoices by age
- API + tab

### Tax Reports
- VAT/sales tax summary by period
- Taxable vs exempt breakdown, tax owed calculation
- API + tab + export

### Budget vs Actual
- Set monthly budgets per account category
- Overview shows actual vs budget with variance %
- API + UI

### PDF Export
- Generate PDF for P&L, Balance Sheet, Trial Balance
- Company header/footer, date range

---

## 3. Marketing & Sales

### Abandoned Cart Recovery
- Page listing pending carts: email, items, total, time since abandonment
- Manual send reminder + auto-schedule
- Requires tracking cart creation time and email capture

### Coupon Management
- Generate codes with: usage limits, per-customer limits, expiry, min order
- Separate from existing Discounts (which are product-level)

### Email Campaigns
- Create/send transactional + broadcast campaigns
- Use existing email provider config (SendGrid/Resend/SMTP)
- Template editor, segment selector, send history

### Push Campaigns
- Send push to admin app users or customer segments
- Reuse existing push notification infrastructure

### SEO Management
- Per-page meta title/description editor
- Sitemap management, robots.txt config
- API + admin UI

### Referral Program
- Configure rewards (points/discount per referral)
- Track referrals, manage payouts

### Gift Cards
- Gift card product type
- Issue/redeem tracking
- Gift card payment method in checkout

### Flash Sales
- Time-limited discounts with countdown
- Configure discount %, start/end time, products
- API + admin UI + storefront display

---

## 4. Content Management

### Blog
- Create/edit posts: title, slug, content (rich text), featured image, category, status
- Public blog page on website
- New Prisma model: `BlogPost`

### FAQ
- Add/edit entries: question, answer, category, sort order
- Public FAQ page
- New Prisma model: `FaqEntry`

### Banner/Slider Manager
- Manage hero banners: image, link, text overlay, sort order, active dates
- New Prisma model: `Banner`

### Static Pages
- Manage About, Privacy, TOS, Contact
- Rich text editor, draft/publish

### Media Gallery
- Central file browser: upload, organize folders, get URLs, bulk delete
- Reuses existing upload infrastructure

---

## 5. Customer Management

### Customer Segments
- Rules-based: spent > X, orders > Y, registered before date
- For targeted campaigns

### Loyalty Tiers
- Tier names, points thresholds, benefits
- Extends existing loyalty system

### Customer Notes
- Internal notes on profiles (staff-only)

### Email History
- Timeline of all emails sent to a customer

### Activity Log
- Per-customer: page views, searches, cart adds, orders, logins

---

## 6. Operations

### Purchase Orders
- Create POs to suppliers, track received/pending
- Link to inventory updates on receive

### Warehouse Management
- Multi-warehouse stock, transfers between warehouses

### Barcode Generation
- Generate EAN-13/Code128, print labels

### Shipping Labels
- Generate labels, optional carrier integration

### Returns Dashboard
- Dedicated returns view: list, process, approve/reject, RMA tracking

### Quality Control
- Inspection checklists, pass/fail tracking, quarantine

---

## 7. Reporting & Analytics

### Custom Report Builder
- Select metrics × dimensions × filters → table/chart + export
- Ad-hoc query interface

### P&L by Category
- Profit/loss broken per product category

### Customer LTV
- Average LTV, cohort analysis by signup month

### Sales by Hour/Day
- Heatmap of sales by hour × day of week

### Inventory Valuation
- Total value at cost vs retail, slow-moving stock

### Margin Analysis
- Gross margin per product/category, margin trends

### YoY Comparison
- Year-over-year revenue/order/customer charts

### Forecasting
- Trend-based revenue forecast (linear regression)

---

## 8. System Administration

### Audit Log Viewer
- Browseable log: action, resource, admin, date
- Filters on all columns

### Webhook Management
- UI to configure outbound webhooks
- Test delivery, view logs

### API Key Management
- Generate/revoke keys, scope permissions

### Cache Management
- Clear Redis, ISR cache, purge CDN

### Feature Flags
- Toggle features on/off without deployment

### System Health
- API response times, error rates, queue depth, uptime

---

## 9. UI/UX Polish

### Dark Mode
- Toggle light/dark, persisted in localStorage
- CSS variables for theme switching

### Loading Skeletons
- Replace plain text/loading with skeleton placeholders

### Responsive Improvements
- Better mobile layouts for tables, forms, dashboard

### Keyboard Shortcuts
- Ctrl+N, Ctrl+S, ? for shortcuts cheat sheet

---

## 10. Internationalization

### Multi-Currency
- Currency selection, exchange rates, price display in selected currency

### Translation UI
- Manage all static translations from admin (edit en/ar texts)

### Tax Rates
- Configure tax rates by region/country, auto-apply at checkout
