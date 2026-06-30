'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Camera, RotateCcw, Minus, Plus, FlipHorizontal, Image as ImageIcon,
} from 'lucide-react'
import { useUI } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function VirtualTryOnModal() {
  const { virtualTryOnProduct, setVirtualTryOnProduct } = useUI()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [ringScale, setRingScale] = useState(0.25)
  const [ringRotation, setRingRotation] = useState(0)
  const [ringX, setRingX] = useState(50)
  const [ringY, setRingY] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [ringLoaded, setRingLoaded] = useState(false)
  const [flipX, setFlipX] = useState(false)
  const ringImgRef = useRef<HTMLImageElement | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopCamera()
    setCameraError(null)
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof DOMException
        ? err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions in your browser settings.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Camera error: ${err.message}`
        : 'Could not access camera.'
      setCameraError(msg)
    }
  }, [stopCamera])

  useEffect(() => {
    if (!virtualTryOnProduct) {
      requestAnimationFrame(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        setCameraReady(false)
        setSnapshot(null)
        setRingScale(0.25)
        setRingRotation(0)
        setRingX(50)
        setRingY(50)
        setFlipX(false)
        setShowGrid(true)
      })
      return
    }
    let cancelled = false
    const id = requestAnimationFrame(() => {
      if (cancelled) return
      startCamera(facingMode)
      setRingLoaded(false)
    })
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = virtualTryOnProduct.imageUrl
    img.onload = () => {
      if (cancelled) return
      ringImgRef.current = img
      setRingLoaded(true)
    }
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      requestAnimationFrame(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        setCameraReady(false)
      })
    }
  }, [virtualTryOnProduct, startCamera, facingMode])

  const switchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    startCamera(next)
  }

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!video || !canvas || !overlay) return

    const overlayRect = overlay.getBoundingClientRect()
    const vw = video.videoWidth
    const vh = video.videoHeight

    canvas.width = vw
    canvas.height = vh

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, vw, vh)

    const cx = (ringX / 100) * overlayRect.width * (vw / overlayRect.width)
    const cy = (ringY / 100) * overlayRect.height * (vh / overlayRect.height)
    const baseSize = 200
    const relScale = ringScale * (overlayRect.width / vw)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(flipX ? -1 : 1, 1)
    ctx.rotate((ringRotation * Math.PI) / 180)
    const size = baseSize * relScale
    if (ringImgRef.current) {
      ctx.drawImage(ringImgRef.current, -size / 2, -size / 2, size, size)
    }
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/png')
    setSnapshot(dataUrl)
    toast.success('Try-on snapshot captured!')
  }

  const handleDownload = () => {
    if (!snapshot) return
    const link = document.createElement('a')
    link.download = `virtual-tryon-${virtualTryOnProduct?.name?.replace(/\s+/g, '-').toLowerCase() || 'ring'}.png`
    link.href = snapshot
    link.click()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !overlayRef.current) return
    const rect = overlayRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setRingX(Math.max(0, Math.min(100, x)))
    setRingY(Math.max(0, Math.min(100, y)))
  }

  const handlePointerUp = () => setDragging(false)

  if (!virtualTryOnProduct) return null

  return (
    <AnimatePresence>
      {virtualTryOnProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90"
        >
          <div className="relative w-full max-w-5xl max-h-[96vh] flex flex-col md:flex-row gap-4 p-4">
            {/* Camera / Preview area */}
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden min-h-[50vh] flex items-center justify-center">
              {cameraError ? (
                <div className="text-center p-8">
                  <Camera className="h-12 w-12 text-gold mx-auto mb-4 opacity-60" />
                  <p className="text-silver text-sm mb-4">{cameraError}</p>
                  <Button
                    onClick={() => startCamera(facingMode)}
                    className="rounded-full bg-gold text-navy-deep hover:bg-gold-soft"
                  >
                    Try Again
                  </Button>
                </div>
              ) : !cameraReady ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                  <p className="text-silver text-sm">Starting camera...</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />
                  {/* Grid overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border border-white/10" />
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
                      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
                      <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
                      {/* Finger placement guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-32 h-48 rounded-[40%] border-2 border-gold/30 border-dashed">
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-gold/50 tracking-widest uppercase whitespace-nowrap">
                            Place ring here
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Ring overlay */}
                  <div
                    ref={overlayRef}
                    className="absolute inset-0"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    style={{ touchAction: dragging ? 'none' : 'auto' }}
                  >
                    {ringLoaded && (
                      <img
                        src={virtualTryOnProduct.imageUrl}
                        alt="Ring preview"
                        draggable={false}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${ringX}%`,
                          top: `${ringY}%`,
                          transform: `translate(-50%, -50%) scale(${ringScale}) rotate(${ringRotation}deg) scaleX(${flipX ? -1 : 1})`,
                          width: '200px',
                          height: '200px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                          transition: dragging ? 'none' : 'left 0.1s, top 0.1s',
                        }}
                      />
                    )}
                  </div>
                  {/* Finger indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-silver text-xs flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                      Drag ring to position on your finger
                    </div>
                  </div>
                </>
              )}

              {/* Snapshot overlay */}
              {snapshot && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={snapshot}
                      alt="Snapshot"
                      className="max-h-[60vh] rounded-xl shadow-2xl border border-white/10"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSnapshot(null)}
                        variant="outline"
                        className="rounded-full border-white/20 text-silver hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button
                        onClick={handleDownload}
                        className="rounded-full bg-gold text-navy-deep hover:bg-gold-soft"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Controls panel */}
            <div className="w-full md:w-72 bg-navy-deep/80 backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
              {/* Product info */}
              <div className="text-center">
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold/60 mb-1">Virtual Try-On</p>
                <h3 className="font-display text-lg text-silver">{virtualTryOnProduct.name}</h3>
              </div>

              {/* Controls */}
              <div className="space-y-4 flex-1">
                {/* Size */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] tracking-wider uppercase text-silver/60">Size</span>
                    <span className="text-xs text-gold">{Math.round(ringScale * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRingScale((s) => Math.max(0.05, s - 0.05))}
                      className="h-8 w-8 rounded-full border border-white/10 text-silver hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={Math.round(ringScale * 100)}
                      onChange={(e) => setRingScale(Number(e.target.value) / 100)}
                      className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer accent-gold [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <button
                      onClick={() => setRingScale((s) => Math.min(0.8, s + 0.05))}
                      className="h-8 w-8 rounded-full border border-white/10 text-silver hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] tracking-wider uppercase text-silver/60">Rotation</span>
                    <span className="text-xs text-gold">{ringRotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRingRotation((r) => r - 15)}
                      className="h-8 w-8 rounded-full border border-white/10 text-silver hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={ringRotation}
                      onChange={(e) => setRingRotation(Number(e.target.value))}
                      className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer accent-gold [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <button
                      onClick={() => setRingRotation((r) => r + 15)}
                      className="h-8 w-8 rounded-full border border-white/10 text-silver hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center"
                    >
                      <RotateCcw className="h-3 w-3 rotate-y-180" />
                    </button>
                  </div>
                </div>

                {/* Flip */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-wider uppercase text-silver/60">Flip</span>
                  <button
                    onClick={() => setFlipX((f) => !f)}
                    className={`h-9 px-4 rounded-full border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      flipX
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 text-silver/60 hover:border-white/20'
                    }`}
                  >
                    <FlipHorizontal className="h-3 w-3" />
                    {flipX ? 'Flipped' : 'Normal'}
                  </button>
                </div>

                {/* Grid toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-wider uppercase text-silver/60">Guide</span>
                  <button
                    onClick={() => setShowGrid((g) => !g)}
                    className={`h-9 px-4 rounded-full border text-xs font-medium transition-colors ${
                      showGrid
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 text-silver/60 hover:border-white/20'
                    }`}
                  >
                    {showGrid ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCapture}
                  disabled={!cameraReady}
                  className="w-full h-12 rounded-full bg-gold text-navy-deep hover:bg-gold-soft font-semibold text-sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Snapshot
                </Button>
                <Button
                  onClick={switchCamera}
                  disabled={!cameraReady}
                  variant="outline"
                  className="w-full h-10 rounded-full border-white/10 text-silver hover:bg-white/5 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Switch Camera
                </Button>
              </div>

              {/* Snapshots */}
              {snapshot && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[10px] tracking-wider uppercase text-silver/40 mb-2">Last captured</p>
                  <img
                    src={snapshot}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover border border-white/10"
                  />
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={() => {
                setVirtualTryOnProduct(null)
                stopCamera()
              }}
              className="absolute top-2 right-2 md:top-4 md:right-4 h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-20"
            >
              <X className="h-5 w-5 text-silver" />
            </button>
          </div>

          {/* Hidden canvas for compositing */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
