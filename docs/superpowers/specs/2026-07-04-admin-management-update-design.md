# Admin Management Update — Design Spec

## Overview
Update the admin management page (`/admin/admins`) with expanded features, better UX, and schema additions for tracking admin activity.

## Schema Changes
Add two fields to the `Admin` model in `prisma/schema.prisma`:
- `phone` (`String?`) — optional phone number for admin contact
- `lastLoginAt` (`DateTime?`) — timestamp of last successful login

## Page Changes

### Roles Tab — Fix Permission Display
- Add all missing `PERMISSION_LABELS` entries for all 23 permissions (both client and server lists)
- Import the full 23-permission list so the checkbox grid shows every available permission
- Fully custom roles: each role defines its own permission set with no base inheritance

### Admins Table — New Columns
Add to the existing table:
- **2FA** column — shows green "Enabled" badge (if `totpEnabled`) or gray "Disabled" badge
- **Phone** column — shows phone number or dash
- **Last Login** column — shows formatted date or "Never"

### Admins Create/Edit Modal
- Add **Phone** input field
- Password remains required for create, optional for edit

### Search Bar
- Add a text input above the admin table to filter by name or email client-side

### Track Last Login
In `src/app/api/admin/auth/login/route.ts`, after successful login, update `admin.lastLoginAt` to `new Date()` before returning the response.

## No Changes To
- Role CRUD logic (already supports fully custom permissions)
- Permission enforcement (super admin bypass unchanged)
- Activity log tab
- API response shapes (backward compatible)
