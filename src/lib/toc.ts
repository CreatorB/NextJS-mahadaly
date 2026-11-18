/**
 * Daftar isi (table of contents) dari sub-judul H2/H3 di dalam isi artikel.
 *
 * Id dibuat ulang secara deterministik dari teks sub-judul — id yang dikirim
 * admin diabaikan, supaya anchor tidak pernah bentrok antar artikel.
 */

import { slugify } from '@/lib/slug'

export interface TocHeading {
  id: string
  text: string
  level: 2 | 3
}

/**
 * @returns heading yang ditemukan + html yang sudah diberi atribut `id`.
 */
export function buildToc(html: string): { headings: TocHeading[]; html: string } {
  const headings: TocHeading[] = []
  const dipakai = new Map<string, number>()

  const htmlBaru = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attrs: string, isi: string) => {
    const text = isi
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
    if (!text) return `<${tag}${attrs}>${isi}</${tag}>`

    const dasar = slugify(text, { maxLength: 60, fallback: 'bagian' })
    const n = dipakai.get(dasar) ?? 0
    dipakai.set(dasar, n + 1)
    const id = n === 0 ? dasar : `${dasar}-${n + 1}`

    const level = tag.toLowerCase() === 'h2' ? 2 : 3
    headings.push({ id, text, level })
    // Atribut id lama dibuang, diganti id yang dihitung di atas.
    const attrsBaru = attrs.replace(/\s+id=["'][^"']*["']/gi, '')
    return `<${tag}${attrsBaru} id="${id}">${isi}</${tag}>`
  })

  return { headings, html: htmlBaru }
}
