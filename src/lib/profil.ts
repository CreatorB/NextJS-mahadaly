import sanitize from 'sanitize-html'
import prisma from '@/lib/prisma'
import { youtubeId } from '@/lib/youtube'

/** Tabel `profil` bersifat singleton: hanya satu baris dengan id ini. */
export const PROFIL_ID = 1

/** Konten cadangan bila baris singleton belum ada di database. */
export const PROFIL_DEFAULT_KONTEN = [
  '<h2>Ma&#39;had Aly Al-Imam Asy-Syathiby</h2>',
  '<p>Ma&#39;had Aly Al-Imam Asy-Syathiby adalah pusat pendidikan Islam yang berada di Cileungsi, Bogor, dengan fokus kajian ilmu syar&#39;i dan bahasa Arab.</p>',
  '<p>Program yang tersedia meliputi Hukum Keluarga Islam (HKI) jenjang S1 Ahwal Syakhsiyyah dengan masa studi empat tahun, serta KIAS (Kursus Ilmu Bahasa Arab dan Syar&#39;i) yang terbuka untuk ikhwan dan akhwat.</p>',
  '<p>Seluruh isi halaman ini dapat disunting sendiri melalui Panel Admin.</p>',
].join('')

const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/'

/**
 * Sanitasi HTML profil.
 *
 * Berbeda dari `sanitizeKonten` (berita), versi ini mengizinkan `<iframe>` — tetapi
 * HANYA untuk video YouTube: `src` dipaksa menjadi URL embed resmi dan iframe
 * dari domain lain dibuang altogether.
 */
export function sanitizeProfilKonten(html: string): string {
  return sanitize(html ?? '', {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img',
      'figure', 'figcaption', 'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      iframe: ['src', 'title', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'referrerpolicy', 'class'],
      figure: ['class'],
      figcaption: ['class'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      img: ['https'],
      iframe: ['https'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitize.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
      iframe: (tagName, attribs): { tagName: string; attribs: Record<string, string>; text?: string } => {
        const id = youtubeId(attribs.src ?? '')
        // Bukan YouTube -> buang iframe, ganti dengan teks biasa.
        if (!id) return { tagName: 'p', attribs: {}, text: '' }
        return {
          tagName: 'iframe',
          attribs: {
            src: `${YOUTUBE_EMBED_BASE}${id}`,
            title: attribs.title || 'Video YouTube',
            width: '100%',
            height: '315',
            frameborder: '0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: 'true',
            loading: 'lazy',
            referrerpolicy: 'strict-origin-when-cross-origin',
            class: 'w-full aspect-video rounded-xl border-0',
          },
        }
      },
    },
  })
}

/** Ambil profil singleton. Kalau tabel/baris belum ada, pakai nilai bawaan. */
export async function getProfil() {
  const row = await prisma.profil.findUnique({ where: { id: PROFIL_ID } })
  return {
    id: row?.id ?? PROFIL_ID,
    konten: row?.konten || PROFIL_DEFAULT_KONTEN,
    videoUrl: row?.videoUrl ?? null,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedById ?? null,
  }
}

/** Simpan profil (upsert baris singleton). */
export async function saveProfil(data: {
  konten: string
  videoUrl: string | null
  updatedById: number | null
}) {
  const videoUrl = data.videoUrl && youtubeId(data.videoUrl) ? data.videoUrl : null
  return prisma.profil.upsert({
    where: { id: PROFIL_ID },
    create: {
      id: PROFIL_ID,
      konten: data.konten,
      videoUrl,
      updatedById: data.updatedById,
    },
    update: {
      konten: data.konten,
      videoUrl,
      updatedById: data.updatedById,
    },
  })
}
