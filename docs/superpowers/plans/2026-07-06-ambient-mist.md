# Ambient Mist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle SVG turbulence fog overlay that drifts with mouse movement.

**Architecture:** Single `AmbientMist` client component with 2 inline SVG filter layers (far + near). SVG renders once at mount; only `transform: translate()` animates per frame via RAF. `pointer-events: none`, `z-0` to stay behind content.

**Tech Stack:** React 19, Next.js 16, SVG `feTurbulence` + `feColorMatrix`

---

## File Structure

### Created:
- `src/components/ui/AmbientMist.tsx` — the mist overlay component

### Modified:
- `src/app/layout.tsx` — add `<AmbientMist />` to body
- `src/app/preview/page.tsx` — add `<AmbientMist />` to preview

---

### Task 1: Create AmbientMist component

**Files:**
- Create: `src/components/ui/AmbientMist.tsx`

- [ ] **Step 1: Create the AmbientMist component**

```tsx
'use client'

import { useEffect, useRef } from 'react'

function svgMist(id: string, frequency: number, opacity: number) {
  return (
    <svg
      key={id}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} />
          <feColorMatrix
            type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${opacity} 0`}
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}

export function AmbientMist() {
  const farRef = useRef<HTMLDivElement>(null)
  const nearRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const pos = useRef({ x: 0, y: 0 })
  const raf = useRef(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout>>()
  const angle = useRef(0)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouse.current.x = e.clientX / window.innerWidth - 0.5
      mouse.current.y = e.clientY / window.innerHeight - 0.5
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        mouse.current.x = 0
        mouse.current.y = 0
      }, 2000)
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
      clearTimeout(idleTimer.current)
    }
  }, [])

  useEffect(() => {
    function tick() {
      angle.current += 0.005
      const driftX = Math.sin(angle.current) * 30
      const driftY = Math.cos(angle.current) * 30

      const tx = mouse.current.x * 60 + driftX
      const ty = mouse.current.y * 60 + driftY
      pos.current.x += (tx - pos.current.x) * 0.05
      pos.current.y += (ty - pos.current.y) * 0.05

      if (farRef.current) {
        farRef.current.style.transform = `translate(${pos.current.x * 0.3}px, ${pos.current.y * 0.3}px)`
      }
      if (nearRef.current) {
        nearRef.current.style.transform = `translate(${pos.current.x * 0.8}px, ${pos.current.y * 0.8}px)`
      }

      raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.6,
      }}
    >
      <div ref={farRef} style={{ position: 'absolute', inset: '-50%', willChange: 'transform' }}>
        {svgMist('mist-far', 0.008, 0.06)}
      </div>
      <div ref={nearRef} style={{ position: 'absolute', inset: '-50%', willChange: 'transform' }}>
        {svgMist('mist-near', 0.02, 0.035)}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify file is syntactically valid**

Run: `npx tsc --noEmit src/components/ui/AmbientMist.tsx 2>&1`
Expected: No type errors

- [ ] **Step 3: Build check**

Run: `npm run build 2>&1`
Expected: Compiles successfully

---

### Task 2: Integrate into root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add import and render AmbientMist**

Add import after line 9:
```tsx
import { AmbientMist } from '@/components/ui/AmbientMist'
```

Add `<AmbientMist />` inside `<body>` after the opening tag (before `<NavigationProgress />` on line 120):
```tsx
        <AmbientMist />
        <NavigationProgress />
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

---

### Task 3: Integrate into preview page

**Files:**
- Modify: `src/app/preview/page.tsx`

- [ ] **Step 1: Add import and render AmbientMist in preview**

Add import at the top (after line 12):
```tsx
import { AmbientMist } from '@/components/ui/AmbientMist'
```

Add `<AmbientMist />` inside the fragment at the top of the return (line 80), before the script tag:
```tsx
  return (
    <>
      <AmbientMist />
      <script
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

---

### Task 4: Deploy to Vercel

- [ ] **Step 1: Deploy**

Run: `vercel deploy --prod 2>&1`
Expected: Build succeeds and deploys
