import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Target, Eye } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getProfil, sanitizeProfilKonten } from '@/lib/profil'

export const dynamic = 'force-dynamic'

const DESCRIPTION =
  "Visi dan Misi Ma'had Aly Al-Imam Asy-Syathiby Cileungsi Bogor: melahirkan generasi ulama rabbani yang profesional, sarjana hukum yang mutqin, kokoh dalam manhaj, serta adaptif terhadap dinamika keberagamaan."

export const metadata: Metadata = {
  title: 'Visi & Misi — Ma\'had Aly Asy-Syathiby',
  description: DESCRIPTION,
  alternates: { canonical: '/visi-misi' },
  openGraph: {
    title: 'Visi & Misi — Ma\'had Aly Al-Imam Asy-Syathiby',
    description: DESCRIPTION,
    url: '/visi-misi',
    type: 'website',
    locale: 'id_ID',
    images: [
      {
        url: '/images/mahadalysyathiby-logo-landscape-name-color-trim.png',
        width: 4361,
        height: 1496,
        alt: "Ma'had Aly Al-Imam Asy-Syathiby",
      },
    ],
  },
}

/**
 * Halaman penuh Visi & Misi.
 *
 * Isi sama dengan section Visi & Misi di beranda (sumber: tabel `profil`),
 * supaya admin cukup menyunting di satu tempat.
 */
export default async function VisiMisiPage() {
  const profil = await getProfil()
  const visi = sanitizeProfilKonten(profil.visi ?? '')
  const misi = sanitizeProfilKonten(profil.misi ?? '')

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-brand-primary text-white py-12 px-4">
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/40 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-accent mb-4">
              Tentang Kami
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Visi &amp; Misi</h1>
            <p className="mt-3 text-sm md:text-base text-blue-100">
              Ma&apos;had Aly Al-Imam Asy-Syathiby — Cileungsi, Bogor
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-6"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="h-7 w-7 text-brand-accent" />
                  <h2 className="text-xl font-bold">Visi</h2>
                </div>
                <div
                  className="prose-berita prose-kartu-gelap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: visi }}
                />
              </div>
              <div className="bg-brand-surface rounded-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-7 w-7 text-brand-primary" />
                  <h2 className="text-xl font-bold text-brand-primary">Misi</h2>
                </div>
                <div className="prose-berita text-sm" dangerouslySetInnerHTML={{ __html: misi }} />
              </div>
            </div>

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
