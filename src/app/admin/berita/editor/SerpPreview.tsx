'use client'
import { SERP_TITLE_MAX_PX, SERP_DESC_MAX_PX, truncateByWidth, pixelWidth } from '@/lib/serp'

interface Props {
  judul: string
  deskripsi: string
  path: string
  baseUrl: string
  /** Kategori/artikel — ditampilkan sebagai breadcrumb Google. */
  crumb?: string
}

/**
 * Pratinjau hasil pencarian (SERP) ala Google: judul dipotong per lebar piksel,
 * bukan per jumlah karakter — supayapanel ini sama dengan hasil sebenarnya.
 */
export function SerpPreview({ judul, deskripsi, path, baseUrl, crumb }: Props) {
  const host = baseUrl.replace(/^https?:\/\//, '')
  const judulTampil = truncateByWidth(judul || 'Judul artikel', SERP_TITLE_MAX_PX)
  const deskripsiTampil = truncateByWidth(deskripsi || 'Deskripsi artikel akan tampil di sini.', SERP_DESC_MAX_PX, 14)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-2 text-xs font-medium text-gray-500">Pratinjau hasil pencarian</p>
      <p className="truncate text-xs text-gray-600">
        <span className="text-gray-500">{host} › Berita</span>
        {crumb ? <span className="text-gray-500"> › {crumb}</span> : null}
        <span> › </span>
      </p>
      <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{judulTampil}</p>
      <p className="mt-0.5 truncate text-sm text-[#006621]">
        {host}{path}
      </p>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#4d5156]">{deskripsiTampil}</p>
      <p className="mt-2 text-[11px] text-gray-400">
        Judul: {judul.length} karakter ({pixelWidth(judul, 20)}px, batas {SERP_TITLE_MAX_PX}px) · Deskripsi:{' '}
        {deskripsi.length} karakter ({pixelWidth(deskripsi, 14)}px, batas {SERP_DESC_MAX_PX}px)
      </p>
    </div>
  )
}
