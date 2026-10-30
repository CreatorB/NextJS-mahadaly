'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Volume2, X } from 'lucide-react'

/**
 * Event global: dipanggil saat modal sambutan ditutup.
 * Hero video mendengarkannya untuk MENYALAKAN suara + melanjutkan pemutaran
 * (hanya mungkin karena pengguna sudah menekan tombol = user gesture).
 */
export const WELCOME_CLOSED_EVENT = 'mahadaly:welcome-closed'

/**
 * Penanda modal sudah ditutup pada sesi browser ini, supaya tidak muncul
 * lagi setiap kali pengguna berpindah-pindah halaman di tab yang sama.
 */
const STORAGE_KEY = 'mahadaly:welcome-dismissed'

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      dismissed = false
    }
    if (dismissed) return
    // Sedikit jeda supaya hero sempat tampil sebelum modal masuk.
    const timer = window.setTimeout(() => setOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* abaikan (mode privat / storage diblokir) */
    }
    // Gesture pengguna -> hero video boleh berbunyi.
    window.dispatchEvent(new CustomEvent(WELCOME_CLOSED_EVENT))
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, close])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sambutan Ma'had Aly Syathiby"
    >
      {/* Latar + area klik di luar kartu */}
      <button
        type="button"
        aria-label="Tutup jendela sambutan"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-brand-primary/85 backdrop-blur-sm"
      />

      <div className="syathiby-modal-in relative w-full max-w-2xl overflow-hidden rounded-3xl border border-brand-accent/40 bg-gradient-to-br from-brand-primary via-[#0a4a9c] to-brand-secondary shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Kilau dekoratif */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-brand-light/25 blur-3xl" />

        <button
          type="button"
          onClick={close}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="mx-auto mb-5 flex w-fit items-center gap-3 rounded-full bg-white/10 px-4 py-2">
            <Image
              src="/images/mahadalysyathiby-logo-white.png"
              alt="Logo Ma'had Aly Al-Imam Asy-Syathiby"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-[11px] font-semibold tracking-[0.18em] text-brand-accent uppercase">
              Ma&apos;had Aly Al-Imam Asy-Syathiby
            </span>
          </div>

          {/* Arab: salam */}
          <p
            dir="rtl"
            lang="ar"
            className="font-arabic text-3xl leading-[1.9] font-bold text-brand-accent drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-4xl"
          >
            مَرْحَبًا بِكُمْ فِي مَوْقِعِنَا الرَّسْمِيِّ
          </p>

          <div className="mx-auto my-5 flex w-fit items-center gap-3">
            <span className="h-px w-14 bg-white/30" />
            <span className="h-1.5 w-1.5 rotate-45 bg-brand-accent ring-1 ring-white/40" />
            <span className="h-px w-14 bg-white/30" />
          </div>

          {/* Indonesia */}
          <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-blue-50 sm:text-lg">
            Selamat datang di official website Ma&apos;had Aly Syathiby (MAISy) dan sekedar
            himbauan kami tidak bertanggung jawab atas informasi lain diluar sana yang tidak
            tercantum di situs ini.
          </p>

          {/* Arab: doa penutup */}
          <p
            dir="rtl"
            lang="ar"
            className="font-arabic mt-5 text-2xl leading-[1.9] font-semibold text-white/95 sm:text-3xl"
          >
            وَفَّقَنَا اللَّهُ جَمِيعًا
          </p>

          <button
            type="button"
            onClick={close}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-accent px-7 py-3.5 text-base font-bold text-brand-primary shadow-lg transition-transform hover:-translate-y-0.5 hover:opacity-95"
          >
            <Volume2 className="h-5 w-5" />
            Tutup &amp; Putar Video
          </button>
          <p className="mt-3 text-xs text-blue-100/80">
            Menutup jendela ini akan memutar video profil dengan suara.
          </p>
        </div>
      </div>
    </div>
  )
}
