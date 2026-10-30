import { youtubeEmbedUrlWith } from '@/lib/youtube'

/**
 * Embed video YouTube (16:9 responsif).
 *
 * Catatan autoplay: browser hanya mengizinkan autoplay kalau video dalam keadaan
 * MUTE — jadi `autoplay: true` otomatis menambah `mute=1`. Pengguna tetap bisa
 * menyalakan suara lewat tombol mute milik player YouTube.
 */
export function YouTubeEmbed({
  videoUrl,
  title,
  autoplay = false,
  muted = false,
  loop = false,
  start,
  hideRelated = false,
  className = 'h-full w-full',
  allow,
}: {
  videoUrl: string | null | undefined
  title: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  start?: number
  hideRelated?: boolean
  className?: string
  allow?: string
}) {
  const src = youtubeEmbedUrlWith(videoUrl, { autoplay, muted, loop, start, hideRelated })
  if (!src) return null

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      allow={allow ?? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'}
      allowFullScreen
      loading={autoplay ? 'eager' : 'lazy'}
      referrerPolicy="strict-origin-when-cross-origin"
    />
  )
}
