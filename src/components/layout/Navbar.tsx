'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, LogIn, UserPlus } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  // Navbar ringkas: Ma'had Aly, KIAS, Pengajar, dan Materi dihapus dari menu
  // (halaman program tetap bisa diakses lewat section Program di beranda & footer).
  const links = [
    { href: '/#pilih-program', label: 'Program', anchor: true },
    { href: '/profil', label: 'Profil', anchor: false },
    { href: '/berita', label: 'Berita', anchor: false },
    { href: '/events', label: 'Event', anchor: false },
    { href: '/#kontak', label: 'Kontak', anchor: true },
  ]

  const linkClass =
    'text-sm font-medium text-white/90 hover:text-brand-accent transition-colors whitespace-nowrap'

  return (
    <nav className="bg-brand-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 lg:h-24 flex items-center">
        <Link href="/" className="shrink-0 flex h-full py-1.5 leading-[0]">
          <Image
            src="/images/mahadalysyathiby-logo-landscape-name-white-trim.png"
            alt="Ma'had Aly Al-Imam Asy-Syathiby"
            width={4361}
            height={1496}
            className="h-full w-auto object-contain block"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 ml-auto">
          {links.map((l) =>
            l.anchor ? (
              <a key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            )
          )}

          {/* Masuk — outline kontras, tetap menonjol tanpa competes dengan Daftar */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/70 px-4 py-2 text-sm font-semibold text-white transition hover:border-brand-accent hover:bg-brand-accent hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            <LogIn className="h-4 w-4" />
            Masuk
          </Link>

          {/* Daftar — tombol utama, paling eye-catching */}
          <Link
            href="/psb"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-5 py-2 text-sm font-bold text-brand-primary shadow-lg shadow-black/25 ring-2 ring-brand-accent/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:ring-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            <UserPlus className="h-4 w-4" />
            Daftar
          </Link>
        </div>

        <button
          className="md:hidden p-2 ml-auto"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden pb-5 px-4 sm:px-6 lg:px-8 flex flex-col gap-1">
          {links.map((l) =>
            l.anchor ? (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium py-2.5 hover:text-brand-accent"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium py-2.5 hover:text-brand-accent"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            )
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-white/70 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-brand-accent hover:bg-brand-accent hover:text-brand-primary"
            >
              <LogIn className="h-4 w-4" />
              Masuk
            </Link>
            <Link
              href="/psb"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-accent px-4 py-2.5 text-sm font-bold text-brand-primary shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <UserPlus className="h-4 w-4" />
              Daftar
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
