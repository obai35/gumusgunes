'use client'

import { useEffect, useState } from 'react'

export function EnhancedAmbientMist() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/pos')) return
    let raf: number
    const target = { x: 0.5, y: 0.5 }
    const current = { x: 0.5, y: 0.5 }
    let idle: ReturnType<typeof setTimeout>
    let angle = 0

    function onMove(e: MouseEvent) {
      target.x = e.clientX / window.innerWidth
      target.y = e.clientY / window.innerHeight
      clearTimeout(idle)
      idle = setTimeout(() => { target.x = 0.5; target.y = 0.5 }, 3000)
    }

    document.addEventListener('mousemove', onMove, { passive: true })

    function tick() {
      angle += 0.003
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
