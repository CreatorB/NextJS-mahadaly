/**
 *_slugify_ teks menjadi slug URL.
 *
 * Dipisah dari `lib/berita.ts` karena file itu meng-import `fs` + Prisma,
 * sedangkan slug dipakai juga di client component (panel admin) — import
 * modul yang menyentuh Node API akan menggagalkan bundling client.
 */

const DIAKRITIK = /[̀-ͯ]/g

export function slugify(text: string, opts: { maxLength?: number; fallback?: string } = {}) {
  const maxLength = opts.maxLength ?? 80
  const fallback = opts.fallback ?? 'berita'
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(DIAKRITIK, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maxLength)
      .replace(/-+$/g, '') || fallback
  )
}

/** Path statis di bawah /berita yang tidak boleh dipakai sebagai slug artikel. */
export const SLUG_RESERVED = ['kategori', 'tag', 'feed', 'feed.xml', 'page', 'api', 'preview'] as const

export function isReservedSlug(slug: string) {
  const s = slug.trim().toLowerCase()
  return (SLUG_RESERVED as readonly string[]).includes(s)
}
