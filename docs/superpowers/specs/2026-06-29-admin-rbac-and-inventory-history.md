# Admin RBAC & Inventory History

## Goal
- Add clickable product rows on inventory page → navigates to product edit page (which already has StockHistory)
- Build a permission system: Roles with configurable permissions, assign roles to admin accounts
- Add sidebar link + page at `/admin/admins` with two tabs: Manage Admins, Manage Roles
- Enforce permissions in sidebar, API routes, and server pages

## Schema Changes

### New Role Model
```
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  permissions String   // JSON array: ["dashboard","accounting","orders",...]
  createdAt   DateTime @default(now())
  admins      Admin[]
}
```

### Modified Admin Model
Add `roleId` field referencing Role. Keep `role` field as denormalized string for backward compatibility during migration.

## Permission Keys
- `dashboard`, `accounting`, `orders`, `receipts`, `products`, `inventory`, `discounts`, `stock_transfers`, `branches`, `pos`, `editor`, `settings`, `security`, `admins`

## UI: `/admin/admins` Page
1. **Admins tab**: Table of admins with columns (Name, Email, Role, Created). "New Admin" button opens modal with fields: Name, Email, Password, Role (dropdown from existing roles).
2. **Roles tab**: Table of roles with columns (Name, Permissions count, Created). "New Role" button opens modal: Name input + permission checkboxes grid. Edit button opens same modal pre-filled. Delete button with confirmation.

## Sidebar
Filter links based on `user.permissions` from Zustand store. Only show links the admin has permission for.

## API Routes
- `GET/POST /api/admin/roles` - List/create roles
- `PUT/DELETE /api/admin/roles/[id]` - Edit/delete role
- `GET/POST /api/admin/admins` - List/create admin accounts
- `PUT/DELETE /api/admin/admins/[id]` - Edit/delete admin

## Permission Enforcement
- Login response returns `user` with `role` and `permissions`
- Zustand store persists permissions
- API helper: `requirePermission(user, permissionKey)` returns 403 if missing
- Server component helper: `getAdminPermissions(token)` returns permissions array
