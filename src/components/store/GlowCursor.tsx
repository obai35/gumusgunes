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