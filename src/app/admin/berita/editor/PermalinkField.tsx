'use client'
import { useEffect, useRef, useState } from 'react'
import { Check, AlertTriangle, RotateCcw, Link2 } from 'lucide-react'
import { slugify } from '@/lib/slug'

interface Props {
  judul: string
  slug: string
  onSlugChange: (s: string) => void
  slugSentuh: boolean
  onSlugSentuh: (v: boolean) => void
  baseUrl: string
  postId?: number
}

/**
 * Editor URL (permalink). Slug dibuat otomatis dari judul selama admin belum
 * menyuntingnya sendiri, dengan pratinjau URL penuh + cek ketersediaan.
 */
export function PermalinkField({
  judul, slug, onSlugChange, slugSentuh, onSlugSentuh, baseUrl, postId,
}: Props) {
  const [cek, setCek] = useState<{ available: boolean; suggestion?: string; alasan?: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Slug mengikuti judul selama belum disentuh manual.
  useEffect(() => {
    if (slugSentuh) return
    const baru = slugify(judul, { maxLength: 80, fallback: 'berita' })
    if (baru !== slug) onSlugChange(baru)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judul, slugSentuh])

  // Cek ketersediaan slug (debounce).
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!slug) return
    timer.current = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ slug })
        if (postId) p.set('id', String(postId))
        const res = await fetch(`/api/admin/berita/slug-check?${p.toString()}`)
        const json = await res.json()
        if (res.ok && json.success) setCek(json.data)
      } catch {
        setCek(null)
      }
    }, 500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [slug, postId])

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">URL artikel</label>
      <div className="flex items-stretch">
        <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 font-mono text-xs text-gray-500">
          <Link2 className="h-3.5 w-3.5" />
        </span>
        <input
          value={slug}
          onChange={(e) => {
            onSlugSentuh(true)
            onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
          }}
          placeholder="otomatis dari judul"
          className={`${input} rounded-l-none`}
        />
        <button
          type="button"
          onClick={() => {
            onSlugSentuh(false)
            onSlugChange(slugify(judul, { maxLength: 80, fallback: 'berita' }))
          }}
          title="Kembalikan ke slug otomatis dari judul"
          className="rounded-r-lg border border-l-0 border-gray-300 px-2.5 text-gray-500 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 break-all font-mono text-xs text-gray-500">
        {baseUrl}/berita/{slug || '...'}
      </p>

      {cek && !cek.available && (
        <p className="mt-1 flex items-start gap-1 text-xs text-amber-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {cek.alasan ?? 'URL belum tersedia'}
            {cek.suggestion && cek.suggestion !== slug && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => {
                    onSlugSentuh(true)
                    onSlugChange(cek.suggestion!)
                  }}
                  className="font-semibold underline"
                >
                  Pakai {cek.suggestion}
                </button>
              </>
            )}
          </span>
        </p>
      )}
      {cek?.available && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3.5 w-3.5" /> URL ini tersedia
        </p>
      )}
    </div>
  )
}
