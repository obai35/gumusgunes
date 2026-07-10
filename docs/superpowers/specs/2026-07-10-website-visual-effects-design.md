# Website Visual Effects — Gümüş Güneş

Date: 2026-07-10  
Status: Design Approved  
Approach: Centralized Effects Layer (Approach A)

## Overview

Add premium visual effects to the main storefront website (not POS, not admin) to enhance the luxury brand experience. Effects follow the existing gold/navy/silver brand palette and use framer-motion + CSS animations.

## Architecture

Effects are split into 3 layers:

```
Root Layout (src/app/layout.tsx)
├── CursorEffects (src/components/store/CursorEffects.tsx)
│   ├── GlowCursor          — gold dot + radial glow following mouse
│   └── SparkleTrail        — golden sparkle particles on cursor path
├── EnhancedAmbientMist     — upgrade existing AmbientMist with stronger gold
└── Page content
    ├── GlowReveal          — scroll-triggered gold glow on sections
    ├── HoverGlow (CSS)     — gold glow on element hover
    └── HeroGlow            — sunburst + rings in hero section
```

## Sections

### 1. Cursor Effects Layer

**Files:**
- `src/components/store/GlowCursor.tsx` (new)
- `src/components/store/SparkleTrail.tsx` (new)
- `src/components/store/CursorEffects.tsx` (new — shared wrapper)

**GlowCursor:**
- Fixed-position overlay (pointer-events: none, z-50)
- Gold dot (~6px) at cursor position with ~120px radial glow behind it
- Uses `CSS.supports('cursor', 'none')` to skip on touch devices
- Smooth lerp (0.08) for fluid following
- Dot is `radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)`
- Hides on touch devices and when pointer leaves the window

**SparkleTrail:**
- Emits sparkle particles along cursor path, max ~15 visible
- Each particle: gold diamond ✦ shape, 4-10px random size, fades out over 1.2s
- Drifts slightly upward while fading
- Throttled emission (~80ms interval during movement)
- Uses CSS transforms + opacity (div elements, not canvas)

**CursorEffects (wrapper):**
- Single `mousemove` listener shared by both effects
- Manages animation frame for cleanup
- Rendered in root layout once

**Integration:**
- Added to `src/app/layout.tsx` wrapping none/page content
- `body { cursor: none }` applied conditionally (non-touch)

### 2. Background Effects — EnhancedAmbientMist

**File:** `src/components/store/EnhancedAmbientMist.tsx` (upgrade from AmbientMist.tsx)

Changes from existing AmbientMist:
- Keep 3-radial-gradient structure
- One gradient becomes gold-dominant (`rgba(212,175,55,0.15)`)
- Gold gradient pulses opacity 0.08 → 0.18 over 6s (CSS keyframe)
- Gold gradient reacts more strongly to mouse position (higher follow weight)
- Other two gradients remain navy/silver tones
- Idle drift active after 3s of no movement

**Integration:** Replaces `AmbientMist` in root layout.

### 3. Element Hover Glow

**File:** `src/app/globals.css` (add utility classes)

```css
.hover-glow {
  transition: box-shadow 0.4s ease, transform 0.3s ease;
}
.hover-glow:hover {
  box-shadow:
    0 0 30px -4px rgba(212, 175, 55, 0.35),
    0 0 60px -8px rgba(212, 175, 55, 0.15);
  transform: translateY(-2px);
}
```

**Application (add `hover-glow` class to):**
- `ProductCard.tsx` — card wrapper
- `CategoryGrid.tsx` — category card wrappers
- `Hero.tsx` — CTA buttons (replace current hover style)
- Trust badges, promo banners — section cards
- Must not conflict with existing `card-hover` class (combine them)

### 4. Scroll-Reveal Glow

**File:** `src/components/store/GlowReveal.tsx` (new)

```tsx
// Wrapper component
<motion.div
  initial={{ opacity: 0, y: 30, boxShadow: '0 0 0px rgba(212,175,55,0)' }}
  whileInView={{
    opacity: 1, y: 0,
    boxShadow: '0 0 40px -8px rgba(212,175,55,0.15)'
  }}
  transition={{ duration: 0.7, ease: 'easeOut' }}
  viewport={{ once: true, margin: '-80px' }}
>
  {children}
</motion.div>
```

**Application (wrap section containers):**
- Hero section
- Featured Products / New Arrivals / Bestsellers
- About Section
- Craftsmanship Timeline
- Testimonials
- Newsletter

Where a section already has framer-motion scroll entry, merge the glow into the existing animation rather than double-wrapping.

### 5. Hero Section Glow

**File:** `src/components/store/Hero.tsx` (modify existing)

Additions:
- **Sunburst background:** A `div` behind the product image with `radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 60%)` that slowly rotates (120s) and pulses scale (1 ↔ 1.1)
- **Concentric rings:** 2-3 thin gold circular borders around the image area. Each ring pulses outward with CSS `@keyframes ring-pulse { 0% { opacity: 0.6; transform: scale(1) } 100% { opacity: 0; transform: scale(1.15) } }` every 4s with staggered delays
- **Increased sparkles:** Bump sparkle count from 12 to ~20, larger sizes (8-16px), more gold in color

## Performance Considerations

- Cursor effects register a single `mousemove` handler (shared)
- Sparkle trail caps at 15 particles, older ones removed
- `GlowReveal` uses `viewport: { once: true }` — animations fire once
- Touch devices skip cursor effects (detect via `matchMedia('(hover: hover)')`)
- `will-change: transform` on animated elements
- Effects are decorative only — no functionality depends on them

## Files Changed Summary

| File | Action |
|------|--------|
| `src/components/store/CursorEffects.tsx` | New |
| `src/components/store/GlowCursor.tsx` | New |
| `src/components/store/SparkleTrail.tsx` | New |
| `src/components/store/EnhancedAmbientMist.tsx` | New (replaces AmbientMist.tsx) |
| `src/components/store/GlowReveal.tsx` | New |
| `src/components/store/Hero.tsx` | Modify — add sunburst, rings, sparkles |
| `src/app/globals.css` | Modify — add hover-glow, animations |
| `src/app/layout.tsx` | Modify — replace AmbientMist with EnhancedAmbientMist, add CursorEffects |
| `src/components/store/ProductCard.tsx` | Modify — add hover-glow class |
| `src/components/store/CategoryGrid.tsx` | Modify — add hover-glow class |
| Various section components | Modify — wrap in GlowReveal or merge glow into existing animations |
