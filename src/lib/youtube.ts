/**
 * Helper YouTube — aman dipakai di server maupun client (tanpa dependency Node).
 *
 * Format yang didukung:
 *   https://youtu.be/dwqXJ3kg7bs
 *   https://www.youtube.com/watch?v=dwqXJ3kg7bs
 *   https://www.youtube.com/embed/dwqXJ3kg7bs
 *   https://www.youtube.com/shorts/dwqXJ3kg7bs
 *   https://www.youtube.com/live/dwqXJ3kg7bs
 *   dwqXJ3kg7bs  (ID polos)
 */

const YT_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
])

const ID_RE = /^[A-Za-z0-9_-]{6,20}$/

/** Ambil ID video YouTube dari berbagai bentuk URL. Null bila bukan YouTube. */
export function youtubeId(input: string | null | undefined): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null

  // ID polos
  if (ID_RE.test(raw) && !raw.includes('/') && !raw.includes('.')) return raw

  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.toLowerCase()
  if (!YT_HOSTS.has(host) && !YT_HOSTS.has(host.replace(/^www\./, ''))) return null

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const seg = url.pathname.split('/').filter(Boolean)[0]
    return seg && ID_RE.test(seg) ? seg : null
  }

  // watch?v=<id>
  const v = url.searchParams.get('v')
  if (v && ID_RE.test(v)) return v

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const segs = url.pathname.split('/').filter(Boolean)
  const kinds = ['embed', 'shorts', 'live', 'v']
  const idx = segs.findIndex((s) => kinds.includes(s.toLowerCase()))
  if (idx >= 0 && segs[idx + 1] && ID_RE.test(segs[idx + 1])) return segs[idx + 1]

  return null
}

/** URL embed siap pakai untuk iframe. Null bila URL bukan YouTube yang valid. */
export function youtubeEmbedUrl(input: string | null | undefined): string | null {
  const id = youtubeId(input)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export interface YoutubeEmbedOptions {
  /** Autoplay hanya diizinkan browser kalau video dimatikan (mute=1). */
  autoplay?: boolean
  muted?: boolean
  /** Loop video tunggal (butuh playlist=ID yang sama). */
  loop?: boolean
  /** Detik mulai. */
  start?: number
  /** Sembunyikan video terkait di akhir pemutaran. */
  hideRelated?: boolean
}

/** URL embed lengkap dengan parameter pemutaran (autoplay/mute/loop/dll). */
export function youtubeEmbedUrlWith(input: string | null | undefined, opts: YoutubeEmbedOptions = {}): string | null {
  const id = youtubeId(input)
  if (!id) return null
  const params = new URLSearchParams()
  if (opts.autoplay) {
    params.set('autoplay', '1')
    // Browser memblokir autoplay bersuara -> mute otomatis.
    params.set('mute', '1')
  } else if (opts.muted) {
    params.set('mute', '1')
  }
  if (opts.loop) {
    params.set('loop', '1')
    params.set('playlist', id)
  }
  if (opts.start && opts.start > 0) params.set('start', String(opts.start))
  if (opts.hideRelated) params.set('rel', '0')
  const qs = params.toString()
  return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ''}`
}

/** URL thumbnail untuk preview di panel admin. */
export function youtubeThumbnail(input: string | null | undefined): string | null {
  const id = youtubeId(input)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

/** True bila input bisa diubah menjadi embed YouTube. */
export function isYouTubeUrl(input: string | null | undefined): boolean {
  return youtubeId(input) !== null
}
