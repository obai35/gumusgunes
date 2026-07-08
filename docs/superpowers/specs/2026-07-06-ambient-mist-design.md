# Ambient Mist — Soft SVG Turbulence Fog Effect

## Goal

Add a subtle, smooth cloud/mist overlay to the site background using SVG `feTurbulence` filter. The mist drifts gently with mouse movement on desktop and auto-drifts on touch devices.

## Constraints

- **Performance:** No canvas, no continuous SVG re-evaluation. SVG filter renders once; only `transform` changes per frame. RAF loop auto-pauses after 2s idle.
- **Cross-device:** Smooth 60fps on mid-range phones. Touch devices get ambient auto-drift.
- **Editor preview:** Must work inside the `/preview` iframe without breaking editable sections (`pointer-events: none`).

## Architecture

### new file: `src/components/ui/AmbientMist.tsx`

A client component that renders a `fixed inset-0 pointer-events-none` overlay containing 2 inline `<svg>` layers rendered as absolutely-positioned elements.

```
AmbientMist (client component)
├── <div id="mist-far">    → SVG turbulence (freq 0.01), 5% opacity, slow follow
├── <div id="mist-near">   → SVG turbulence (freq 0.02), 3% opacity, faster follow
└── RAF loop:
    ├── mousemove → targetX, targetY
    ├── lerp current → target (smooth easing)
    ├── translate layers accordingly
    └── 2s idle timeout → auto-drift circle
```

### SVG turbulence generation

Each layer contains an inline `<svg>` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <filter id="mist">
    <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" />
    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#mist)" />
</svg>
```

The `baseFrequency` differs per layer (0.01 far, 0.02 near). The `feColorMatrix` sets the alpha to ~5% (adjustable). The `<rect>` fills the viewport.

### Mouse tracking

- `onMouseMove` on `document` sets target coordinates
- RAF lerp: `currentX += (targetX - currentX) * 0.05` (smooth ease)
- Layers move at different multipliers: far `0.03`, near `0.08`
- 2s idle → slow circular drift (radius ~50px, period ~8s)
- `touchmove` on touch devices: no positioning response, just ambient drift

### Performance

- SVG filters render once at mount (browser caches the rasterized output)
- Only `transform: translate(Xpx, Ypx)` per frame on 2 elements
- RAF loop uses a `isActive` flag: pauses entirely when no movement for 2s
- Uses `will-change: transform` on both layers

## Integration

### modified: `src/app/layout.tsx`

Add `<AmbientMist />` inside `<body>`, before `<NavigationProgress />`:

```tsx
import { AmbientMist } from '@/components/ui/AmbientMist'
```

### modified: `src/app/preview/page.tsx`

Add `<AmbientMist />` at the top of the returned JSX, inside the fragment:

```tsx
import { AmbientMist } from '@/components/ui/AmbientMist'
```

## Editor Preview Compatibility

- `pointer-events: none` ensures no click interference with `[data-editable]` sections
- Fixed positioning works inside iframe (no restrictions)
- No dependencies on window features blocked by cross-origin iframes
- Mist renders behind all content (`z-0`)
