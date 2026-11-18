'use client'
import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface Props {
  judul: string
  url: string
}

/** Tombol berbagi artikel (WhatsApp, Telegram, Facebook, X, salin tautan). */
export function ShareButtons({ judul, url }: Props) {
  const [tersalin, setTersalin] = useState(false)
  const teks = encodeURIComponent(judul)
  const tautan = encodeURIComponent(url)

  const tombol = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${teks}%20${tautan}`, warna: 'hover:bg-green-50 hover:text-green-700' },
    { label: 'Telegram', href: `https://t.me/share/url?url=${tautan}&text=${teks}`, warna: 'hover:bg-sky-50 hover:text-sky-700' },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${tautan}`, warna: 'hover:bg-blue-50 hover:text-blue-700' },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${tautan}&text=${teks}`, warna: 'hover:bg-gray-100 hover:text-gray-900' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${tautan}`, warna: 'hover:bg-sky-50 hover:text-sky-800' },
  ]

  async function salin() {
    try {
      await navigator.clipboard.writeText(url)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    } catch {
      // Clipboard ditolak browser — tidak disruptive, biarkan saja.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Share2 className="h-3.5 w-3.5" /> Bagikan
      </span>
      {tombol.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition ${t.warna}`}
        >
          {t.label}
        </a>
      ))}
      <button
        type="button"
        onClick={salin}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        {tersalin ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        {tersalin ? 'Tersalin' : 'Salin tautan'}
      </button>
    </div>
  )
}
