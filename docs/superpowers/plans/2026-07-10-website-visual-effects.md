# Website Visual Effects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add premium glow, cursor, and scroll effects to the Gümüş Güneş main storefront website.

**Architecture:** Centralized effects layer in root layout (CursorEffects wrapper + EnhancedAmbientMist) + per-element CSS/component enhancements (hover-glow, GlowReveal, HeroGlow).

**Tech Stack:** Next.js 16, framer-motion, Tailwind CSS 4, TypeScript

---

### Task 1: Add CSS utilities and keyframes to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add glow and animation keyframes/utilities**

Add these to `src/app/globals.css` after the existing utilities:

```css
/* ===== Visual Effects ===== */

.hover-glow {
  transition: box-shadow 0.4s ease, transform 0.3s ease;
}

.hover-glow:hover {
  box-shadow:
    0 0 30px -4px rgba(212, 175, 55, 0.35),
    0 0 60px -8px rgba(212, 175, 55, 0.15);
  transform: translateY(-2px);
}

@keyframes ring-pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.15);
  }
}

@keyframes sun-rotate {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes sun-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.8; }
}

@keyframes glow-dot {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add hover-glow utility and glow keyframes to globals.css"
```

---

### Task 2: Create EnhancedAmbientMist component

**Files:**
- Create: `src/components/ui/EnhancedAmbientMist.tsx`
- The existing `AmbientMist.tsx` will be replaced — keep the file but this new component takes its place in layout

- [ ] **Step 1: Create EnhancedAmbientMist.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'

export function EnhancedAmbientMist() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    let raf: number
    const target = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    let idle: ReturnType<typeof setTimeout>
    let angle = 0
    let pulsePhase = 0

    function onMove(e: MouseEvent) {
      target.x = e.clientX / window.innerWidth
      target.y = e.clientY / window.innerHeight
      clearTimeout(idle)
      idle = setTimeout(() => { target.x = 0.5; target.y = 0.5 }, 3000)
    }

    document.addEventListener('mousemove', onMove, { passive: true })

    function tick() {
      angle += 0.003
      pulsePhase += 0.02
      const driftX = Math.sin(angle) * 0.05
      const driftY = Math.cos(angle) * 0.05
      current.x += (target.x + driftX - current.x) * 0.03
      current.y += (target.y + driftY - current.y) * 0.03
      setPos({ x: current.x, y: current.y })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      clearTimeout(idle)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '120%',
          height: '120%',
          top: '-10%',
          left: '-10%',
          background: `radial-gradient(ellipse at ${pos.x * 100}% ${pos.y * 100}%, rgba(212, 175, 55, 0.18) 0%, transparent 50%),
                       radial-gradient(ellipse at ${100 - pos.x * 100}% ${100 - pos.y * 100}%, rgba(200, 180, 140, 0.1) 0%, transparent 40%),
                       radial-gradient(ellipse at ${pos.x * 70 + 15}% ${pos.y * 70 + 15}%, rgba(212, 175, 55, 0.1) 0%, transparent 35%)`,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/EnhancedAmbientMist.tsx
git commit -m "feat: add EnhancedAmbientMist with stronger gold gradients"
```

---

### Task 3: Create GlowCursor component

**Files:**
- Create: `src/components/store/GlowCursor.tsx`

- [ ] **Step 1: Create GlowCursor.tsx**

```tsx
'use client'

import { useEffect, useRef } from 'react'

export function GlowCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchMedia('(hover: hover)').matches) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf: number

    function onMove(e: MouseEvent) {
      target.x = e.clientX
      target.y = e.clientY
    }

    function onLeave() {
      if (dotRef.current) dotRef.current.style.opacity = '0'
      if (glowRef.current) glowRef.current.style.opacity = '0'
    }

    function onEnter() {
      if (dotRef.current) dotRef.current.style.opacity = '1'
      if (glowRef.current) glowRef.current.style.opacity = '1'
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)

    function tick() {
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${current.x - 3}px, ${current.y - 3}px)`
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${current.x - 60}px, ${current.y - 60}px)`
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'opacity 0.3s',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.8)',
          boxShadow: '0 0 6px rgba(212,175,55,0.5)',
          pointerEvents: 'none',
          zIndex: 10000,
          transition: 'opacity 0.3s',
        }}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/GlowCursor.tsx
git commit -m "feat: add GlowCursor with gold dot and radial glow"
```

---

### Task 4: Create SparkleTrail component

**Files:**
- Create: `src/components/store/SparkleTrail.tsx`

- [ ] **Step 1: Create SparkleTrail.tsx**

```tsx
'use client'

import { useEffect, useRef } from 'react'

type Sparkle = {
  id: number
  x: number
  y: number
  size: number
  createdAt: number
}

export function SparkleTrail() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sparklesRef = useRef<Sparkle[]>([])
  const rafRef = useRef<number>(0)
  const lastEmitRef = useRef(0)

  useEffect(() => {
    if (!matchMedia('(hover: hover)').matches) return

    let nextId = 0

    function onMove(e: MouseEvent) {
      const now = Date.now()
      if (now - lastEmitRef.current < 80) return
      lastEmitRef.current = now

      sparklesRef.current.push({
        id: nextId++,
        x: e.clientX,
        y: e.clientY,
        size: 4 + Math.random() * 6,
        createdAt: now,
      })

      if (sparklesRef.current.length > 15) {
        sparklesRef.current = sparklesRef.current.slice(-15)
      }
    }

    document.addEventListener('mousemove', onMove, { passive: true })

    function tick() {
      const now = Date.now()
      const container = containerRef.current
      if (!container) { rafRef.current = requestAnimationFrame(tick); return }

      const alive = sparklesRef.current.filter(s => now - s.createdAt < 1200)

      if (alive.length !== sparklesRef.current.length) {
        sparklesRef.current = alive
      }

      container.innerHTML = ''
      for (const s of alive) {
        const age = (now - s.createdAt) / 1200
        const opacity = 1 - age
        const yOffset = -age * 30
        const el = document.createElement('div')
        el.style.cssText = `
          position:fixed;
          left:${s.x}px;
          top:${s.y}px;
          width:${s.size}px;
          height:${s.size}px;
          transform:translateY(${yOffset}px);
          opacity:${opacity};
          pointer-events:none;
          z-index:9998;
          color:rgba(212,175,55,${opacity});
          font-size:${s.size}px;
          line-height:1;
        `
        el.textContent = '✦'
        container.appendChild(el)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/SparkleTrail.tsx
git commit -m "feat: add SparkleTrail with golden particle effects"
```

---

### Task 5: Create CursorEffects wrapper

**Files:**
- Create: `src/components/store/CursorEffects.tsx`

- [ ] **Step 1: Create CursorEffects.tsx**

```tsx
'use client'

import { GlowCursor } from './GlowCursor'
import { SparkleTrail } from './SparkleTrail'

export function CursorEffects() {
  if (typeof window !== 'undefined' && !matchMedia('(hover: hover)').matches) return null

  return (
    <>
      <GlowCursor />
      <SparkleTrail />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/CursorEffects.tsx
git commit -m "feat: add CursorEffects wrapper component"
```

---

### Task 6: Create GlowReveal component

**Files:**
- Create: `src/components/store/GlowReveal.tsx`

- [ ] **Step 1: Create GlowReveal.tsx**

```tsx
'use client'

import { motion } from 'framer-motion'

type GlowRevealProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function GlowReveal({ children, className, delay = 0 }: GlowRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, boxShadow: '0 0 0px rgba(212,175,55,0)' }}
      whileInView={{
        opacity: 1,
        y: 0,
        boxShadow: '0 0 40px -8px rgba(212,175,55,0.12)',
      }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      viewport={{ once: true, margin: '-80px' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/GlowReveal.tsx
git commit -m "feat: add GlowReveal scroll-triggered glow wrapper"
```

---

### Task 7: Update root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx imports and usage**

Replace:
```tsx
import { AmbientMist } from "@/components/ui/AmbientMist";
```
With:
```tsx
import { EnhancedAmbientMist } from "@/components/ui/EnhancedAmbientMist";
import { CursorEffects } from "@/components/store/CursorEffects";
```

Replace:
```tsx
        <AmbientMist />
```
With:
```tsx
        <EnhancedAmbientMist />
        <CursorEffects />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add EnhancedAmbientMist and CursorEffects to root layout"
```

---

### Task 8: Enhance Hero section with glow effects

**Files:**
- Modify: `src/components/store/Hero.tsx`

- [ ] **Step 1: Add sunburst, rings, and enhanced sparkles to Hero.tsx**

Modify the hero section in `Hero.tsx`. After the decorative sun rays div (around line 32-36), add a sunburst div:

```tsx
      {/* Sunburst rotating glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] max-w-[90vw] max-h-[90vw]"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 50%)',
            animation: 'sun-rotate 120s linear infinite, sun-pulse 6s ease-in-out infinite',
          }}
        />
      </div>
```

Add concentric rings around the image. Replace the decorative ring section (around line 122-124 in the current file) with:

```tsx
              {/* Decorative rings */}
              <div className="absolute -inset-4 rounded-full border border-gold/20" />
              <div className="absolute -inset-8 rounded-full border border-gold/10" />
              {/* Pulsing rings */}
              <div className="absolute -inset-12 rounded-full border border-gold/20" style={{ animation: 'ring-pulse 4s ease-out infinite' }} />
              <div className="absolute -inset-16 rounded-full border border-gold/10" style={{ animation: 'ring-pulse 4s ease-out 1s infinite' }} />
```

Increase sparkle count and make them more golden. Replace the sparkles section (around line 40-55) with:

```tsx
      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${10 + (i * 5) % 80}%`,
              left: `${5 + (i * 9) % 90}%`,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 3, delay: i * 0.25, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <Sparkles className={`${i % 3 === 0 ? 'h-4 w-4' : 'h-3 w-3'} text-gold/70`} />
          </motion.div>
        ))}
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/Hero.tsx
git commit -m "feat: enhance Hero with sunburst, pulsing rings, and more sparkles"
```

---

### Task 9: Apply hover-glow to ProductCard

**Files:**
- Modify: `src/components/store/ProductCard.tsx`

- [ ] **Step 1: Add hover-glow class to ProductCard**

In `ProductCard.tsx`, find the motion.div card wrapper (around line 48-55). Add `hover-glow` to its className:

```tsx
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 card-hover hover-glow cursor-pointer"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/ProductCard.tsx
git commit -m "feat: add hover-glow to product cards"
```

---

### Task 10: Apply hover-glow to CategoryGrid cards

**Files:**
- Modify: `src/components/store/CategoryGrid.tsx`

- [ ] **Step 1: Add hover-glow to category card links**

In `CategoryGrid.tsx`, find the `motion.a` for each child category (around line 62-104). Add `hover-glow` to its className:

```tsx
                className="group relative overflow-hidden rounded-2xl bg-navy image-zoom luxury-shadow hover-glow aspect-[4/5] sm:aspect-square"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/store/CategoryGrid.tsx
git commit -m "feat: add hover-glow to category grid cards"
```

---

### Task 11: Wrap sections in GlowReveal

**Files:**
- Modify: `src/components/store/AboutSection.tsx`
- Modify: `src/components/store/Testimonials.tsx`
- Modify: `src/components/store/Newsletter.tsx`

- [ ] **Step 1: Wrap AboutSection root in GlowReveal**

In `AboutSection.tsx`, import GlowReveal and wrap the section's outer element:

```tsx
import { GlowReveal } from './GlowReveal'
```

Find the outer `<section>` tag and wrap it:

```tsx
<GlowReveal>
  <section className="py-20 sm:py-28 bg-background overflow-hidden">
    ...
  </section>
</GlowReveal>
```

- [ ] **Step 2: Wrap Testimonials root in GlowReveal**

In `Testimonials.tsx`:

```tsx
import { GlowReveal } from './GlowReveal'
```

Wrap the outer `<section>`:

```tsx
<GlowReveal>
  <section className="py-20 sm:py-28 bg-background overflow-hidden">
    ...
  </section>
</GlowReveal>
```

- [ ] **Step 3: Wrap Newsletter root in GlowReveal**

In `Newsletter.tsx`:

```tsx
import { GlowReveal } from './GlowReveal'
```

Wrap the outer `<section>`:

```tsx
<GlowReveal>
  <section className="py-20 sm:py-28 bg-navy-deep relative overflow-hidden">
    ...
  </section>
</GlowReveal>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/store/AboutSection.tsx src/components/store/Testimonials.tsx src/components/store/Newsletter.tsx
git commit -m "feat: add scroll-reveal glow to About, Testimonials, Newsletter sections"
```

---

### Task 12: Apply hover-glow to Trust Badges and CTA buttons

**Files:**
- Modify: `src/components/store/TrustBadges.tsx`
- Modify: `src/components/store/Hero.tsx`

- [ ] **Step 1: Add hover-glow to TrustBadges cards**

In `TrustBadges.tsx`, find the individual badge cards and add `hover-glow` to their className.

- [ ] **Step 2: Add hover-glow to Hero CTA buttons**

In `Hero.tsx`, add `hover-glow` to the CTA link and search button className.

- [ ] **Step 3: Commit**

```bash
git add src/components/store/TrustBadges.tsx src/components/store/Hero.tsx
git commit -m "feat: add hover-glow to trust badges and hero CTAs"
```
