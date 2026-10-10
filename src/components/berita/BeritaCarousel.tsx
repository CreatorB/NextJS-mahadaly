'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface Props {
  children: React.ReactNode
  /** Jeda antar geser otomatis (ms). */
  interval?: number
}

const DRAG_THRESHOLD = 6

/**
 * Carousel horizontal: geser otomatis satu kartu, berhenti saat kursor/fokus/sentuhan berada di
 * dalam carousel atau tab tidak aktif, kembali ke awal setelah kartu terakhir.
 * Bisa digeser manual dengan drag mouse, swipe, shift+scroll, panah samping, atau tombol di bawah.
 *
 * Auto-slide tetap berjalan walau sistem meminta "reduced motion" (banyak PC Windows mematikan
 * efek animasi secara default) — pengunjung bisa menghentikannya lewat tombol jeda.
 */
export function BeritaCarousel({ children, interval = 4000 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: number; id: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [touchedUntil, setTouchedUntil] = useState(0)
  const [userPaused, setUserPaused] = useState(false)

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.firstElementChild as HTMLElement | null
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0
    const width = (card?.offsetWidth ?? track.clientWidth) + gap
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8
    const atStart = track.scrollLeft <= 8
    if (dir === 1 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' })
    else if (dir === -1 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
    else track.scrollBy({ left: dir * width, behavior: 'smooth' })
  }, [])

  const paused = hovered || focused || userPaused || dragging

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      if (document.hidden || Date.now() < touchedUntil) return
      step(1)
    }, interval)
    return () => window.clearInterval(id)
  }, [paused, interval, step, touchedUntil])

  // Klik di dalam iframe Instagram memindahkan fokus ke iframe (tidak memicu focus event di halaman).
  useEffect(() => {
    const onBlur = () => {
      if (trackRef.current?.contains(document.activeElement)) setFocused(true)
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !trackRef.current) return
    drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: 0, id: e.pointerId }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const track = trackRef.current
    if (!d || !track || e.pointerId !== d.id) return
    const dx = e.clientX - d.x
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved < DRAG_THRESHOLD) return
    if (!dragging) {
      setDragging(true)
      track.setPointerCapture(e.pointerId)
    }
    track.scrollLeft = d.left - dx
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (track?.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId)
    if (dragging) setDragging(false)
    // drag.current dibiarkan sampai onClickCapture supaya klik setelah drag bisa dibatalkan
    window.setTimeout(() => (drag.current = null), 0)
  }

  const sideBtn =
    'absolute top-[280px] z-10 hidden -translate-y-1/2 rounded-full bg-white/95 p-3 text-brand-primary shadow-lg ring-1 ring-slate-200 transition hover:scale-105 md:block'

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setFocused(false)
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onTouchStart={() => setTouchedUntil(Date.now() + 8000)}
      aria-roledescription="carousel"
    >
      <button type="button" onClick={() => step(-1)} className={`${sideBtn} -left-3`} aria-label="Geser ke kiri">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button type="button" onClick={() => step(1)} className={`${sideBtn} -right-3`} aria-label="Geser ke kanan">
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if ((drag.current?.moved ?? 0) >= DRAG_THRESHOLD) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className={`flex gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          dragging
            ? 'cursor-grabbing select-none [&_iframe]:pointer-events-none'
            : 'cursor-grab snap-x snap-mandatory scroll-smooth'
        }`}
      >
        {children}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:text-brand-primary"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setUserPaused((v) => !v)}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:text-brand-primary"
          aria-label={userPaused ? 'Putar otomatis' : 'Jeda'}
          title={userPaused ? 'Putar otomatis' : 'Jeda'}
        >
          {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:text-brand-primary"
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

/** Pembungkus tiap kartu: lebar tetap + snap. */
export function CarouselItem({ children }: { children: React.ReactNode }) {
  return <div className="w-[300px] shrink-0 snap-start sm:w-[340px]">{children}</div>
}
