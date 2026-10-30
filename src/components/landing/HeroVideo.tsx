'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { youtubeId, youtubeEmbedUrlWith } from '@/lib/youtube'
import { WELCOME_CLOSED_EVENT } from './WelcomeModal'

/**
 * Hero video (YouTube) untuk landing page.
 *
 * Memakai YouTube IFrame API karena kita perlu menyalakan suara dari luar
 * iframe (browser hanya mengizinkan pemutaran bersuara setelah ada gesture
 * pengguna).
 *
 * Suara dinyalakan otomatis pada dua situasi:
 * 1. jendela sambutan ditutup (tombol "Tutup & Putar Video"), dan
 * 2. interaksi pertama pengunjung di halaman (klik/scroll/keyboard/sentuh) —
 *    sehingga pengunjung tidak perlu menyentuh menu player.
 *
 * Fallback: bila script iframe_api gagal dimuat, dipakai iframe biasa; saat
 * suara diminta, src iframe diganti ke versi tanpa `mute=1` (tetap autoplay).
 */

const API_SRC = 'https://www.youtube.com/iframe_api'
const ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'

type Player = {
  unMute?: () => void
  mute?: () => void
  playVideo?: () => void
  getPlayerState?: () => number
}

/**
 * True kalau pengguna benar-benar sudah berinteraksi dengan halaman (klik, tekan
 * tombol, dsb). Browser HANYA mengizinkan pemutaran bersuara setelah interaksi
 * seperti ini — scroll otomatis bukan interaksi, jadi tidak dihitung.
 */
function hasUserActivation(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }
  return nav.userActivation?.hasBeenActive === true
}

let apiPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'))
  const win = window as unknown as {
    YT?: { Player?: unknown }
    onYouTubeIframeAPIReady?: () => void
  }
  if (win.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve, reject) => {
    const prev = win.onYouTubeIframeAPIReady
    win.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const tag = document.createElement('script')
      tag.src = API_SRC
      tag.async = true
      tag.onerror = () => reject(new Error('gagal-muat-iframe-api'))
      document.head.appendChild(tag)
    }
    window.setTimeout(() => reject(new Error('timeout-iframe-api')), 10000)
  })

  return apiPromise
}

export function HeroVideo({
  videoUrl,
  title,
  className = 'h-full w-full',
}: {
  videoUrl: string | null | undefined
  title: string
  className?: string
}) {
  const id = youtubeId(videoUrl)
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const wantSoundRef = useRef(false)
  const unmuteAtRef = useRef(0)
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !mountRef.current) return
        const YT = (window as unknown as {
          YT: { Player: new (el: HTMLElement, opts: unknown) => Player }
        }).YT
        playerRef.current = new YT.Player(mountRef.current, {
          videoId: id,
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: id,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (e: { target: Player & { getIframe?: () => HTMLIFrameElement } }) => {
              try {
                // Kalau pengunjung sudah berinteraksi sungguhan, langsung berbunyi.
                if (wantSoundRef.current && hasUserActivation()) {
                  unmuteAtRef.current = Date.now()
                  e.target.unMute?.()
                } else {
                  e.target.mute?.()
                }
                e.target.playVideo?.()
              } catch {
                /* abaikan */
              }
              // Pastikan iframe punya izin autoplay (delegasi ke player).
              try {
                const frame = e.target.getIframe?.()
                if (frame && !(frame.getAttribute('allow') || '').includes('autoplay')) {
                  frame.setAttribute('allow', ALLOW)
                }
              } catch {
                /* abaikan */
              }
            },
            onStateChange: (e: { data: number }) => {
              // Browser menolak pemutaran bersuara tanpa interaksi -> player bisa
              // PAUSED. Supaya video tidak membeku, kembalikan ke mode muted
              // (autoplay muted selalu diizinkan browser).
              if (e.data === 2 && unmuteAtRef.current && Date.now() - unmuteAtRef.current < 4000) {
                unmuteAtRef.current = 0
                try {
                  playerRef.current?.mute?.()
                  playerRef.current?.playVideo?.()
                } catch {
                  /* abaikan */
                }
              }
            },
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setFallbackSrc(
          youtubeEmbedUrlWith(videoUrl, {
            autoplay: true,
            muted: !wantSoundRef.current,
            loop: true,
            hideRelated: true,
          }),
        )
      })

    return () => {
      cancelled = true
    }
  }, [id, videoUrl])

  // Nyalakan suara + pastikan video berjalan.
  const unmuteAndPlay = useCallback(() => {
    const player = playerRef.current
    if (player && typeof player.unMute === 'function') {
      try {
        unmuteAtRef.current = Date.now()
        player.unMute()
        player.playVideo?.()
        return true
      } catch {
        /* lanjut ke fallback */
      }
    }
    return false
  }, [])

  // Modal sambutan ditutup -> nyalakan suara + lanjutkan pemutaran.
  useEffect(() => {
    const onWelcomeClosed = () => {
      wantSoundRef.current = true
      if (unmuteAndPlay()) return
      // Fallback: ganti src iframe ke versi tanpa mute.
      setFallbackSrc(
        youtubeEmbedUrlWith(videoUrl, {
          autoplay: true,
          muted: false,
          loop: true,
          hideRelated: true,
        }),
      )
    }
    window.addEventListener(WELCOME_CLOSED_EVENT, onWelcomeClosed)
    return () => window.removeEventListener(WELCOME_CLOSED_EVENT, onWelcomeClosed)
  }, [videoUrl, unmuteAndPlay])

  // Interaksi pertama pengunjung (klik/ketik/sentuh) -> suara langsung nyala,
  // tanpa perlu menyentuh menu player. Syaratnya: interaksi sungguhan
  // (dicek lewat User Activation API) — scroll otomatis bukan gestur, jadi
  // tidak dicoba (kalau dipaksa, browser bisa membekukan video).
  useEffect(() => {
    let done = false
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'keydown']
    const onInteract = () => {
      if (done) return
      if (!hasUserActivation()) return
      done = true
      wantSoundRef.current = true
      if (!unmuteAndPlay()) {
        setFallbackSrc(
          youtubeEmbedUrlWith(videoUrl, {
            autoplay: true,
            muted: false,
            loop: true,
            hideRelated: true,
          }),
        )
      }
      cleanup()
    }
    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, onInteract))
      document.removeEventListener('scroll', onInteract)
    }
    events.forEach((e) => window.addEventListener(e, onInteract, { passive: true }))
    // Scroll ikut dipantau: kalau pengguna memang sedang scrolls-gulir dengan
    //-tetikus/jarinya, itu interaksi sungguhan (dicek lewat User Activation).
    document.addEventListener('scroll', onInteract, { passive: true, capture: true })
    return cleanup
  }, [videoUrl, unmuteAndPlay])

  if (!id) return null

  return (
    <div className={className}>
      {fallbackSrc ? (
        <iframe
          src={fallbackSrc}
          title={title}
          className="h-full w-full"
          allow={ALLOW}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div ref={mountRef} className="h-full w-full" />
      )}
    </div>
  )
}
