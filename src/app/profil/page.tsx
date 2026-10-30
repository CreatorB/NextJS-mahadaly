import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { getProfil, sanitizeProfilKonten } from '@/lib/profil'
import { youtubeEmbedUrl } from '@/lib/youtube'

export const dynamic = 'force-dynamic'

const DESCRIPTION =
  "Profil Ma'had Aly Al-Imam Asy-Syathiby, Cileungsi Bogor: program Hukum Keluarga Islam (HKI) S1 Ahwal Syakhsiyyah dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i)."

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Profil Ma'had Aly — Asy-Syathiby",
    description: DESCRIPTION,
    alternates: { canonical: '/profil' },
    openGraph: {
      title: "Profil Ma'had Aly Al-Imam Asy-Syathiby",
      description: DESCRIPTION,
      url: '/profil',
      type: 'website',
      locale: 'id_ID',
    },
    twitter: { card: 'summary_large_image', title: "Profil Ma'had Aly — Asy-Syathiby", description: DESCRIPTION },
  }
}

export default async function ProfilPage() {
  const profil = await getProfil()
  const embed = youtubeEmbedUrl(profil.videoUrl)

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Judul halaman */}
        <section className="relative overflow-hidden bg-brand-primary text-white py-12 px-4">
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-accent mb-4">
              Tentang Kami
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Profil Ma&apos;had Aly</h1>
            <p className="mt-3 text-sm md:text-base text-blue-100 max-w-2xl mx-auto">
              Ma&apos;had Aly Al-Imam Asy-Syathiby — Cileungsi, Bogor
            </p>
          </div>
        </section>

        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Video utama */}
            {embed && (
              <div className="mb-10 overflow-hidden rounded-2xl shadow-[0_20px_60px_-30px_rgba(0,54,124,0.55)] bg-black">
                <div className="aspect-video w-full">
                  <YouTubeEmbed
                    videoUrl={profil.videoUrl}
                    title="Video profil Ma'had Aly Al-Imam Asy-Syathiby"
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}

            {/* Isi profil (disunting dari Panel Admin) */}
            <div
              className="prose-berita"
              dangerouslySetInnerHTML={{ __html: sanitizeProfilKonten(profil.konten) }}
            />

            {profil.updatedAt && (
              <p className="mt-10 border-t border-gray-100 pt-4 text-xs text-gray-400">
                Terakhir diperbarui:{' '}
                {profil.updatedAt.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
