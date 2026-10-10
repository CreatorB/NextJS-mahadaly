/**
 * Ambil postingan terbaru akun Instagram publik TANPA API resmi/token:
 * halaman embed profil (https://www.instagram.com/<username>/embed/) memuat data ±6 postingan
 * terakhir (shortcode, caption, tanggal). Yang disimpan hanya metadata; tampilan memakai
 * embed resmi per postingan (iframe /p/<shortcode>/embed/), jadi tidak ada gambar yang diunduh.
 *
 * Catatan: format halaman ini bukan API yang dijamin Instagram — bila berubah, sinkron otomatis
 * gagal dengan pesan error di admin, dan postingan tetap bisa ditambah manual lewat URL.
 */

export interface IgEmbedPost {
  shortcode: string
  caption: string | null
  postedAt: Date | null
}

// Instagram menyajikan versi halaman berbeda per User-Agent; UA browser lengkap mendapat halaman
// tanpa data postingan, UA pendek mendapat data lengkap. Dicoba berurutan sampai ada hasil.
const USER_AGENTS = ['Mozilla/5.0 Chrome/130.0', 'Mozilla/5.0', 'facebookexternalhit/1.1']

/** Data di halaman berupa JSON yang di-escape dua kali di dalam string JS. */
function decodeEscaped(raw: string) {
  let s = raw
  for (let i = 0; i < 2; i++) {
    try {
      s = JSON.parse(`"${s}"`)
    } catch {
      break
    }
  }
  return s
}

export function parseProfileEmbed(html: string): IgEmbedPost[] {
  const marks = [...html.matchAll(/shortcode[\\"]+:[\\"]+([A-Za-z0-9_-]{5,})/g)]
  const posts = new Map<string, IgEmbedPost>()
  marks.forEach((m, i) => {
    const code = m[1]
    if (posts.has(code)) return
    const seg = html.slice(m.index!, marks[i + 1]?.index ?? m.index! + 20000)
    const cap = seg.match(/edge_media_to_caption[\\"]+:\{[\\"]+edges[\\"]+:\[\{[\\"]+node[\\"]+:\{[\\"]+text[\\"]+:\\*"(.*?)\\*"\}\}\]/)
    const ts = seg.match(/taken_at_timestamp[\\"]+:(\d{9,})/)
    posts.set(code, {
      shortcode: code,
      caption: cap ? decodeEscaped(cap[1]).trim() || null : null,
      postedAt: ts ? new Date(Number(ts[1]) * 1000) : null,
    })
  })
  return [...posts.values()]
}

export async function fetchProfilePosts(username: string): Promise<IgEmbedPost[]> {
  let lastStatus = 0
  for (const ua of USER_AGENTS) {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/embed/`, {
      headers: { 'User-Agent': ua, Accept: '*/*' },
      cache: 'no-store',
    })
    lastStatus = res.status
    if (!res.ok) continue
    const posts = parseProfileEmbed(await res.text())
    if (posts.length) return posts
  }
  throw new Error(
    lastStatus && lastStatus !== 200
      ? `Instagram membalas HTTP ${lastStatus} (coba lagi nanti)`
      : 'Tidak ada postingan terbaca (akun privat atau format halaman Instagram berubah)',
  )
}

/** Ambil shortcode dari URL postingan/reel Instagram. */
export function shortcodeFromUrl(input: string): string | null {
  const m = input.trim().match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]{5,})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{5,20}$/.test(input.trim()) ? input.trim() : null
}

export const igEmbedUrl = (shortcode: string) => `https://www.instagram.com/p/${shortcode}/embed/`
export const igPostUrl = (shortcode: string) => `https://www.instagram.com/p/${shortcode}/`
