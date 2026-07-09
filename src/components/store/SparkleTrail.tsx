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