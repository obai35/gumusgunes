# Site Editor with Live Preview — Design Spec

## Overview

Replace the current static site editor with a full visual CMS: a top-toolbar + full-page iframe preview editor in the admin panel, plus an in-place `?edit=true` overlay mode on the public site. Only logged-in admins can edit.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Browser                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Top Toolbar: [Section ▼] [+ Add] [Publish] [ ]    ││
│  │  [Desktop|Tablet|Mobile] [Exit]                     ││
│  ├─────────────────────────────────────────────────────┤│
│  │                                                     ││
│  │  ┌────────────────────────────────────────────────┐ ││
│  │  │           iframe (/preview)                     │ ││
│  │  │  Full storefront rendered with draft settings   │ ││
│  │  │  Editable sections have hover overlays           │ ││
│  │  └────────────────────────────────────────────────┘ ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                    Slide-out Panel (right)               │
│  ┌────────────────────────────────────────────┐          │
│  │ Section fields (color, text, image, etc.) │          │
│  └────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 Public Site (?edit=true)                  │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Top bar: [ Exit Edit Mode ]                        ││
│  │                                                     ││
│  │  ┌─[Edit]──┐  ┌─[Edit]──┐                           ││
│  │  │ Hero    │  │ Feature │  ← Dashed border on       ││
│  │  │ Section │  │d Section│    hover, click to edit    ││
│  │  └─────────┘  └─────────┘                           ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Layers

1. **Data** — Expanded `SiteSetting` model with JSON values for complex sections
2. **Editor** — Top toolbar + iframe preview admin page with slide-out section panels
3. **Preview** — Dedicated `/preview` route rendering the real storefront with current settings
4. **Overlay** — `?edit=true` mode on the public site with click-to-edit admin overlay

## Data Model

All values stored in the existing `SiteSetting` table (`key` unique, `value` string).

### Section Keys and Structures

| Key | Type | Description |
|-----|------|-------------|
| `theme` | JSON | `{ primaryColor, accentColor, bgColor, textColor, fontBody, fontHeading, borderRadius, buttonStyle }` |
| `branding` | JSON | `{ siteName, tagline, logoUrl, favicon }` |
| `hero` | JSON | `{ title, subtitle, backgroundImage, overlayOpacity, ctaText, ctaLink, layoutVariant }` |
| `announcement` | JSON | `{ text, enabled, bgColor, textColor, dismissible }` |
| `navigation` | JSON | `{ items: [{ id, label, href, children: [...], badge }] }` |
| `footer` | JSON | `{ columns: [{ title, links: [{ label, href }] }], socialLinks, copyright, newsletter }` |
| `sections` | JSON | `{ order: [string], visibility: Record<string, boolean> }` |
| `seo` | JSON | `{ titleTemplate, description, ogImage, keywords }` |
| `custom_css` | string | Raw CSS injected into `<head>` |
| `custom_js` | string | Raw JS injected before `</body>` |
| `about_text` | string | About section content (supports markdown) |
| `testimonials` | JSON | Array of testimonial objects |
| `trust_badges` | JSON | Array of badge objects |

Existing flat keys (`primaryColor`, `heroTitle`, etc.) will be migrated into their respective JSON sections during the first save.

### Data Flow (Single State)

- **Single live state**: Editor saves changes directly to the DB immediately (optimistic PUT). No draft/publish distinction.
- **Preview**: The `/preview` route reads the same live data from the DB. Since the editor saves optimistically, changes appear instantly.
- **"Publish" button**: Acts as a "Save All" — saves all pending changes and refreshes the preview iframe. Shows a success toast.

## Editor Panel (Admin)

### Layout

- **Full viewport** editor page at `/admin/editor`
- **Top toolbar** (sticky, ~56px): Section dropdown, Add Section, Save/Publish, Device switcher, Exit
- **Full-page iframe** below the toolbar loading `/preview`
- **Slide-out panel** from the right when a section is selected (~400px wide)
- Panel is resizable/draggable

### Top Toolbar Elements

| Element | Behavior |
|---------|----------|
| Section dropdown | Lists all editable sections. Selecting opens the slide-out panel. |
| + Add Section | Opens a modal/dropdown of available section types to insert |
| Save / Publish | Saves all changes, shows success toast, refreshes preview |
| Device switcher | Desktop (100%), Tablet (768px), Mobile (375px) — resizes iframe width |
| Eye icon | Toggles edit overlays on/off in the iframe |
| Exit | Navigates back to admin dashboard |

### Slide-Out Panel

For each section type, the panel shows appropriate controls:

**Theme section:**
- Color pickers for primary, accent, background, text colors
- Font dropdowns for body and heading
- Border radius slider
- Button style selector (solid, outline, ghost)

**Hero section:**
- Text inputs for title, subtitle
- Image upload with preview for background
- Opacity slider for overlay
- CTA text + link
- Layout variant selector (centered, left-aligned, split)

**Navigation section (menu builder):**
- Drag-to-reorder list of nav items
- Each item: label, href, badge, enable children toggle
- Nested children editor
- "Add Item" button

**Footer section:**
- Column editor (add/remove/reorder columns)
- Each column: title, list of links
- Social links editor (platform picker + URL)
- Copyright text, newsletter toggle

**Sections (layout):**
- Drag-to-reorder all page sections
- Visibility toggle per section
- "Remove section" (hides, does not delete)

### Preview Communication

When a setting changes in the editor:
1. Save to DB (optimistic PUT to `/api/admin/settings`)
2. Post message to iframe: `iframe.contentWindow.postMessage({ type: 'settings-update', key, value }, '*')`
3. The `/preview` page listens for this message and re-fetches settings

## Preview Route

A dedicated route at `/app/preview/page.tsx` that:
1. Checks for admin auth (must be logged in)
2. Renders the full storefront layout (Header, Hero, ProductGrid, Footer, etc.)
3. Reads settings from DB (same data the live site uses)
4. Sets CSS variables from theme settings on `document.documentElement`
5. Listens for `postMessage` events to hot-reload settings without full refresh
6. Adds `data-editable="section-name"` attributes on each section for edit overlay detection

The preview route imports and renders the same components as the homepage but passes custom settings.

## Edit Mode Overlay (`?edit=true`)

### Activation
- Adding `?edit=true` to any public URL activates edit mode
- A top bar appears: "Edit Mode" label + "Exit Edit Mode" button
- Checks admin auth via `/api/admin/auth/me` — if not authenticated, shows "Login to edit" and redirects

### Visual Indicators
- Each editable section has a gold dashed border (`2px dashed #c9a84c`) on hover
- A floating "Edit" pill button appears at the top-right of each section
- When toggled off via settings, overlay is hidden

### Click-to-Edit
- Clicking an "Edit" pill opens a compact inline popover
- Popover contains the most relevant field(s) for that section (e.g., hero title text input)
- For complex edits, the popover has "Open in Editor" which navigates to `/admin/editor` with the section pre-selected
- Changes save immediately via PUT `/api/admin/settings`

## Backend API

### New/Modified Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/settings` | GET | Returns all settings (merged defaults + DB values) |
| `/api/admin/settings` | PUT | Accepts `{ key, value }` or full batch `{ key1: val1, ... }` — upserts |

### Settings Data Flow

```
Editor Panel → PUT /api/admin/settings (immediate save)
                → DB updated
                → postMessage to iframe
                  → /preview re-renders with new settings

Save/Publish → PUT /api/admin/settings (batch save)
                → Toast success
                → Iframe refreshes

Public site → GET /api/site-settings
              → Returns live settings
```

## Auth Enforcement

- `/admin/editor` — already protected by AdminShell (must be logged in)
- `/preview` — checks admin auth, redirects to login if not authenticated
- `?edit=true` — checks admin auth via `/api/admin/auth/me` before showing edit controls
- All settings API endpoints — require admin auth

## Implementation Phases

### Phase 1: Core Editor + Preview
1. Expand site settings data model to support JSON section values
2. Create migration for existing flat keys into JSON sections
3. Rewrite `/admin/editor/page.tsx` with top toolbar + iframe layout
4. Create `/preview` route that renders the storefront with draft settings
5. Build section edit panels (theme, branding, hero, announcement, navigation, footer)
6. Add section layout manager (order, visibility)
7. Implement device switcher

### Phase 2: Edit Mode Overlay
8. Add `?edit=true` detection to the public site layout
9. Build admin auth check for edit mode
10. Add editable section indicators (dashed borders, edit pills)
11. Build inline edit popovers for key sections
12. Wire "Open in Editor" links to `/admin/editor`

### Phase 3: Advanced Features
13. Image upload endpoint and integration
14. Rich text content blocks (About, testimonials)
15. Custom CSS/JS injection
16. SEO settings management

## Files to Create/Modify

### New Files
- `src/app/preview/page.tsx` — Preview route (renders storefront with draft settings)
- `src/components/admin/editor/EditorToolbar.tsx` — Top toolbar component
- `src/components/admin/editor/SectionPanel.tsx` — Slide-out panel container
- `src/components/admin/editor/sections/ThemePanel.tsx` — Theme edit panel
- `src/components/admin/editor/sections/HeroPanel.tsx` — Hero edit panel
- `src/components/admin/editor/sections/BrandingPanel.tsx` — Branding edit panel
- `src/components/admin/editor/sections/AnnouncementPanel.tsx` — Announcement edit panel
- `src/components/admin/editor/sections/NavigationPanel.tsx` — Menu builder panel
- `src/components/admin/editor/sections/FooterPanel.tsx` — Footer edit panel
- `src/components/admin/editor/sections/LayoutPanel.tsx` — Section order/visibility panel
- `src/components/admin/editor/sections/SEOPanel.tsx` — SEO edit panel
- `src/components/admin/editor/sections/CustomCodePanel.tsx` — CSS/JS edit panel
- `src/components/store/EditModeOverlay.tsx` — Overlay component for `?edit=true`
- `src/components/admin/editor/preview-messaging.ts` — postMessage helpers

### Modified Files
- `src/app/admin/editor/page.tsx` — Complete rewrite with toolbar + iframe + slide-out panel
- `src/app/api/admin/settings/route.ts` — Accept batch PUT (multi-key) if not already supported
- `src/app/layout.tsx` — Add edit mode detection + conditional overlay
- `src/components/store/DesignProvider.tsx` — Support consuming settings from props (for preview mode)
- `src/lib/store.ts` — Add editor state if needed

## Constraints

- Only the admin user (logged in via admin auth) can access editor and preview
- `?edit=true` overlay requires admin auth — non-admins see the normal site
- All settings stored as strings in SQLite (JSON serialized for complex values)
- Preview iframe loads from the same origin (no CORS issues)
- Changes save immediately (optimistic), no undo
