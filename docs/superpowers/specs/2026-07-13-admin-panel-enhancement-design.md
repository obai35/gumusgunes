# Admin Panel Enhancement — Design Spec

## Overview

Upgrade every admin panel tab with modern UI patterns, responsive layout, comprehensive error handling, data export, bulk actions, keyboard shortcuts, and professional-grade UX. Standardize component patterns across all 23 admin tabs while adding per-tab advanced features.

## Guiding Principles

1. **Responsive first** — All tables, forms, and layouts work on mobile (collapsed sidebar, scrollable tables, stacked cards)
2. **Error-proof** — Every API call wrapped in try/catch with user-facing error toasts. Every form has validation. Every destructive action has confirmation dialog.
3. **Performance** — Pagination on all lists, debounced search, lazy-loaded tab content, skeleton loading states
4. **Consistency** — Shared component library for DataTable, SearchInput, PageHeader, StatusBadge, ActionMenu, FilterBar
5. **Professional** — Loading skeletons, empty state illustrations, smooth transitions, toast notifications, audit trail

## Architecture

### Shared Component Library

All components in `src/components/admin/` with consistent API:

**Existing (to enhance):**

| Component | File | Enhancement |
|-----------|------|-------------|
| AdminShell | `AdminShell.tsx` | Responsive sidebar, collapsible on mobile as Sheet drawer |
| AdminAuthGuard | `AdminAuthGuard.tsx` | No changes needed |
| DataTable | `DataTable.tsx` | Integrate `@tanstack/react-table`, add sortable columns, selectable rows, bulk actions |
| ErrorBoundary | `ErrorBoundary.tsx` | Add retry button, render error details |
| PageHeader | `PageHeader.tsx` | Add breadcrumbs, action buttons slot, subtitle |
| Pagination | `Pagination.tsx` | Add page size selector, total count display, go-to-page input |
| SearchInput | `SearchInput.tsx` | Add debounce, advanced filters panel toggle |
| Skeleton | `Skeleton.tsx` | Add table/card/form skeleton variants |
| StatsCard | `StatsCard.tsx` | Add trend indicator, clickability, icon |
| StatusBadge | `StatusBadge.tsx` | Add clickable filter toggle |

**New components:**

| Component | File | Description | Depends On |
|-----------|------|-------------|-----------|
| FilterBar | `FilterBar.tsx` | Date range, status, source dropdowns with clear all | shadcn Popover, Calendar |
| ActionMenu | `ActionMenu.tsx` | Dropdown per row: edit/delete/duplicate | shadcn DropdownMenu |
| EmptyState | `EmptyState.tsx` | Illustration + description + CTA | lucide icons |
| BulkActionBar | `BulkActionBar.tsx` | Floating bar: selected count + actions | framer-motion |
| ExportButton | `ExportButton.tsx` | CSV/Excel with date picker | exceljs |
| KeyboardShortcuts | `KeyboardShortcuts.tsx` | Ctrl+K search, Ctrl+N new, ? help | (hook-based) |
| ConfirmDialog | (use shadcn AlertDialog) | Destructive action confirmation | shadcn AlertDialog |
| Toast | (use shadcn Sonner) | Success/error/info toasts | shadcn Sonner |

### State Management Pattern

Each tab follows this pattern:
- `useDataFetching` hook: handles loading/error/data states, pagination, search, filters
- `useMutations` hook: handles create/update/delete with toast feedback
- Local state for UI toggles (modals, panels, selections)
- No global state — each tab is self-contained

### Error Handling Strategy

```
API call → try/catch → toast error + log to console
Render  → ErrorBoundary → show fallback + retry button
Form    → client-side validation + server error display
Network → retry on timeout (3 attempts) + offline banner
```

### Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 768px | Sidebar hidden (hamburger), tables stacked as cards, filters in collapsible panel |
| 768-1024px | Sidebar collapsed (icons only), tables with horizontal scroll |
| > 1024px | Full sidebar, all columns visible |

## Per-Tab Feature Specifications

### Dashboard (`/admin`)
**Files:** `src/app/admin/page.tsx`

**Current:** Basic stats cards, 7-day bar chart, recent orders, low-stock alerts

**Enhanced:**
- **Stats row** — Revenue (today/this week/this month with % change), Orders count, New customers, Avg order value, Products sold
- **Revenue chart** — Toggle between daily/weekly/monthly. Compare with previous period. Line chart with area fill.
- **Order status funnel** — Visual pipeline: Pending → Processing → Shipped → Delivered with counts
- **Top products** — Best-sellers this period with revenue contribution %
- **Recent orders** — Expandable rows, quick status change, view detail link
- **Activity feed** — Recent admin actions (orders, edits, reviews) with timestamp
- **Quick actions** — Buttons: New order, New product, New discount, View reports
- **Low stock alerts** — Products below reorder threshold with link to inventory
- **Period selector** — Today, Yesterday, This Week, This Month, Custom range
- **Auto-refresh** — Optional 30s polling toggle

**Components needed:**
- `StatsCard` — (enhanced) with trend arrow, percentage change, icon, gradient background
- `RevenueChart` — NEW: recharts-based, period toggle, comparison mode
- `OrderFunnel` — NEW: horizontal pipeline visual
- `TopProducts` — NEW: ranked list with bar indicators
- `ActivityFeed` — NEW: scrollable timeline
- `QuickActions` — NEW: icon button grid
- `PeriodSelector` — NEW: segmented control + date picker

### Orders (`/admin/orders`)
**Files:** `src/app/admin/orders/page.tsx`, `src/app/admin/orders/[id]/page.tsx`

**Current:** Search + status filters + table

**Enhanced:**
- **Advanced filters** — Status multi-select, payment method, date range, amount range, governorate, customer search
- **Bulk actions** — Select orders → change status, export selected, print selected
- **Table columns** — Order ID, Customer, Date, Items, Total, Payment, Status, Actions
- **Sortable columns** — Click header to sort asc/desc
- **Quick status change** — Dropdown per row to change status with confirmation
- **Export** — CSV/Excel with current filters applied, or export all
- **Order detail page** — Enhanced with timeline view, notes panel, payment history, shipping tracking, item list with images
- **Invoice generation** — PDF invoice with company branding
- **Print packing slip** — Clean format for warehouse
- **Notes** — Internal notes per order, admin can add/edit
- **Audit log** — Status changes with admin name and timestamp

### Products (`/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`)

**Current:** CRUD + search + pagination + bulk toggle active/featured

**Enhanced:**
- **Table** — Image thumbnail, Name/SKU, Category, Price (+ compare-at), Stock, Status toggles (active/featured), Actions
- **Bulk edit** — Select products → bulk change: price (±%), category, active status, featured status, delete
- **CSV import** — Upload CSV with mapping preview, validation errors report
- **CSV export** — All fields or selected columns
- **Duplicate product** — One-click duplicate with "(Copy)" suffix
- **SEO preview** — Google preview card showing how product appears in search
- **Quick price edit** — Inline editable price field
- **Stock history** — Mini chart per product showing stock changes over time
- **Image gallery** — Drag-drop reorder, upload multiple, crop
- **Variants** — Size/color matrix with per-variant price and stock
- **Discount badge** — Show compare-at price vs current with discount percentage

### Categories (`/admin/categories`)

**Current:** CRUD with tree hierarchy, visibility toggle

**Enhanced:**
- **Drag-drop reorder** — Within same level
- **Inline edit** — Edit name, slug, visibility directly in tree
- **Bulk assign** — Select multiple products → assign to category
- **Category image** — Upload hero image per category
- **Meta fields** — Title + description per category for SEO
- **Visibility schedule** — Show/hide on specific dates
- **Product count** — Show number of products per category

### Inventory (`/admin/inventory`, `/admin/inventory/adjust`)

**Current:** Stock list (sorted low-to-high), recent logs, adjust form

**Enhanced:**
- **Stock table** — Product name, SKU, current stock, low stock threshold, branch stock (if multi-branch), status indicator (green/yellow/red)
- **Auto-reorder** — Set minimum stock threshold per product, highlight when below
- **Stock movement** — Line chart per product showing inbound/outbound over time
- **Batch adjust** — Upload CSV with product SKU + quantity change
- **Transfer wizard** — Step-by-step: select source → destination → products → quantities → confirm
- **Inventory count sheet** — Generate PDF for physical count
- **Stock value** — Total inventory value (cost × quantity) summary card
- **Alerts** — Low stock email notification settings

### Discounts (`/admin/discounts`, `/admin/discounts/new`)

**Current:** List + create form

**Enhanced:**
- **Table** — Code, Type, Value, Usage count, Remaining uses, Status (active/expired/scheduled), Actions
- **Usage analytics** — Times used, total discount amount, revenue from discounted orders
- **Schedule** — Start date + end date with active/inactive indicator
- **Auto-expire** — Automatically deactivate after end date
- **Customer targeting** — Minimum order amount, specific governorates, specific categories
- **Stacking rules** — Can this discount be combined with others?
- **Bulk deactivate** — Select and deactivate expired discounts

### Customers (`/admin/customers`, `/admin/customers/[id]`)

**Current:** Search + table + order history per customer

**Enhanced:**
- **Table** — Name, Email, Phone, Total orders, Total spent, Last purchase, Status (active/inactive), Actions
- **Customer segments** — Auto-tagged: VIP (>$1000 spent), Regular, New (<30 days), At-risk (>90 days inactive)
- **Detail page** — Profile info, order history with status chips, total spent card, average order value
- **Purchase analytics** — Frequency chart, preferred categories, average order value trend
- **Communication log** — Email/SMS history, notes per customer
- **Export** — Customer list as CSV
- **Bulk actions** — Export selected, send email campaign

### Reviews (`/admin/reviews`)

**Current:** List + search + filter + approve/delete + CSV export

**Enhanced:**
- **Moderation queue** — Pending reviews at top, approved/hidden in tabs
- **Bulk approve** — Select multiple pending reviews → approve all
- **Review analytics** — Average rating over time chart, rating distribution bar, top reviewed products
- **Reply to reviews** — Admin can reply to customer reviews
- **Photo gallery** — Grid view of review photos
- **Reported reviews** — Flagged by customers for inappropriate content
- **Export** — Reviews CSV with rating, product, date, status

### Shipping (`/admin/shipping`)

**Current:** 4 tabs: Methods, Rates, Free Shipping Rules, Shipments

**Enhanced:**
- **Methods** — CRUD with estimated days, icon, carrier selection
- **Rates** — Per-governorate grid, bulk edit rates, import CSV
- **Free shipping rules** — Min amount, governorate-specific, date range
- **Shipments** — Tracking number input, bulk status update, delivery performance (% on-time)
- **Rate calculator** — Test shipping cost for a given governorate + order amount
- **Label preview** — Preview shipping label format
- **Delivery analytics** — On-time delivery %, average delivery time per governorate

### Social (`/admin/social/**`)

**Current:** Posts, campaigns, analytics, settings, comments

**Enhanced:**
- **Unified calendar** — All scheduled posts in month/week view
- **Post preview** — See how post looks on Instagram/Facebook before publishing
- **Hashtag analytics** — Most used hashtags, engagement per hashtag
- **Best time** — Suggested posting times based on past engagement
- **Comment queue** — Inline reply without leaving admin
- **Campaign performance** — Budget spent vs results, ROI calculator

### Customer Service (`/admin/customer-service`)

**Current:** Agent management, role assignment

**Enhanced:**
- **Conversation queue** — Unassigned, assigned to me, all conversations with status
- **Assignment rules** — Round-robin, skill-based, manual
- **Response time tracking** — Average first response time, resolution time
- **Canned responses** — Create/edit/delete saved responses by category
- **CSAT score** — Post-conversation customer satisfaction rating
- **Agent performance** — Conversations handled, response times, CSAT per agent

### Site Editor (`/admin/editor`)

**Current:** 10 panels: Hero, Layout, Navigation, Branding, Categories, Theme, SEO, Promo, Footer, Announcement, Custom Code

**Enhanced:**
- **Version history** — Save snapshots, restore previous versions
- **Draft/publish** — Edit in draft mode, publish when ready
- **Scheduled changes** — Set future publish date
- **Component library** — Drag components into layout
- **Preview device toggle** — Desktop/tablet/mobile preview
- **Auto-save** — Save draft every 30 seconds

### Settings (`/admin/settings`)

**Enhanced:**
- **Search settings** — Type to filter settings
- **Grouped view** — Collapsible groups by category
- **Validation** — Per-field validation with error messages
- **Change history** — Who changed what and when
- **Test email** — Send test email to verify SMTP config

### Admins/Security (`/admin/admins`, `/admin/security`)

**Enhanced:**
- **Login history** — Table of recent logins with IP, timestamp, success/failure
- **Session management** — View active sessions, force logout
- **Permission matrix** — Visual grid: role × permission with checkboxes
- **IP whitelist** — Restrict admin access to specific IPs

### Payments (`/admin/payments`)

**Current:** 2 tabs: Settings, Verification

**Enhanced:**
- **Pending verification** — Queue of payment proofs to verify, filter by date
- **Manual capture** — Capture authorized Stripe/PayPal payments
- **Refund workflow** — Select order → select items → refund amount → process (Stripe/PayPal/bank)
- **Payment analytics** — Revenue by method, success rate, average processing time
- **Reconciliation** — Match payments to orders, flag discrepancies

### Newsletter (`/admin/newsletter`)

**Current:** Subscriber list management

**Enhanced:**
- **Send email** — Compose and send from admin (Rich text editor)
- **Template editor** — Save email templates
- **Campaign stats** — Sent count, open rate, click rate, unsubscribe rate
- **Unsubscribe tracking** — List of unsubscribes with date

### Accounting (`/admin/accounting`)

**Current:** Full double-entry: Journal, Accounts, Trial Balance, Overview, Period filtering, CSV export

**Enhanced:**
- **Reports dashboard** — Pre-built reports: P&L, Balance Sheet, Cash Flow
- **Tax calculation** — Auto-calculate VAT/sales tax per period
- **P&L export** — PDF/CSV profit & loss statement
- **Bank reconciliation** — Upload bank statement CSV, match transactions
- **Budget tracking** — Set budget per account, track variance

## Implementation Order

The admin panel will be implemented in phases, starting with shared components, then the most-used tabs:

1. **Phase 1: Shared components** — Enhance existing (DataTable with `@tanstack/react-table`, SearchInput, Pagination, StatsCard, PageHeader, Skeleton, ErrorBoundary, AdminShell). Create new (FilterBar, ActionMenu, EmptyState, BulkActionBar, ExportButton, KeyboardShortcuts hook).
2. **Phase 2: Dashboard** — Enhanced stats cards, RevenueChart (recharts), OrderFunnel, TopProducts, ActivityFeed, PeriodSelector, auto-refresh
3. **Phase 3: Orders** — Advanced filters, bulk actions, sortable DataTable, export, order detail page enhancements, notes panel
4. **Phase 4: Products** — Enhanced DataTable with image previews, bulk edit modal, CSV import/export, duplicate, SEO preview, stock chart
5. **Phase 5: Remaining tabs** — Categories (drag-reorder), Inventory (stock chart + transfers), Discounts (analytics), Customers (segments), Reviews (analytics), Shipping (rate calculator)
6. **Phase 6: Specialized tabs** — Social (calendar), Customer Service (queue), Site Editor (versioning), Settings (search), Admins/Security (permission matrix), Payments (refund), Newsletter (campaigns), Accounting (reports)
7. **Phase 7: Polish** — Keyboard shortcuts, responsive testing, performance optimization, error boundary coverage across all tabs

## Technical Decisions

- **Charts:** Recharts (already in deps) for all chart components
- **Tables:** Enhance existing `DataTable.tsx` with `@tanstack/react-table` (already in deps) for sorting, selection, column visibility
- **Toasts:** Sonner via shadcn/ui `sonner` component (already in deps, `src/components/ui/sonner.tsx`)
- **Modals/Dialogs:** shadcn/ui `AlertDialog` for confirmations, `Dialog` for forms, `Sheet` for mobile sidebar
- **Dropdowns:** shadcn/ui `DropdownMenu` for ActionMenu, `Select` for filters
- **Date handling:** date-fns (already in deps)
- **CSV/Excel export:** exceljs (already in deps, `^4.4.0`) for both CSV and Excel export
- **PDF:** Browser print API (`window.print()`) for packing slips; add `jspdf` later if complex PDF generation is needed
- **Icons:** Lucide React (already in deps via shadcn/ui `^0.525.0`)
- **Drag-drop:** `@dnd-kit` (already in deps — present in package.json) for sortable lists and tree reorder
- **Form validation:** React Hook Form + Zod (already in deps)
- **Animations:** framer-motion (already in deps `^12.23.2`) for dropdowns, modals, transitions
- **State management:** No react-query — use plain `fetch` in `useEffect` (existing pattern). Consider extracting useFetching/useMutation hooks later.
