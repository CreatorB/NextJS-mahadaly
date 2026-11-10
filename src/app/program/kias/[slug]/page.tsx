import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import {
  KATEGORI_KIAS,
  getHalamanInfoBySlug,
  getHalamanInfoList,
  sanitizeHalamanInfo,
} from '@/lib/halaman-info'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

/**
 * Halaman informasi KIAS (isi disunting dari panel admin).
 *
 * Contoh URL: /program/kias/profil-kias, /program/kias/panduan-santri.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const halaman = await getHalamanInfoBySlug(slug)
  if (!halaman) return { title: 'Halaman tidak ditemukan' }

  const description = halaman.ringkasan ?? `Informasi ${halaman.judul} KIAS Ma'had Aly Asy-Syathiby.`

  return {
    title: `${halaman.judul} | KIAS`,
    description,
    alternates: { canonical: `/program/kias/${halaman.slug}` },
    openGraph: {
      title: `${halaman.judul} | KIAS — Asy-Syathiby`,
      description,
      url: `/program/kias/${halaman.slug}`,
      type: 'article',
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
    twitter: {
      card: 'summary_large_image',
      title: `${halaman.judul} | KIAS`,
      description,
      images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
    },
  }
}

export default async function HalamanInfoKiasPage({ params }: Props) {
  const { slug } = await params
  const [halaman, semua] = await Promise.all([
    getHalamanInfoBySlug(slug),
    getHalamanInfoList({ kategori: KATEGORI_KIAS, hanyaTampil: true }),
  ])
  if (!halaman) notFound()

  const lainnya = semua.filter((h) => h.id !== halaman.id)

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="relative overflow-hidden bg-brand-primary text-white py-12 px-4">
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="relative max-w-4xl mx-auto">
            <Link
              href="/program/kias#info-kias"
              className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Semua info KIAS
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{halaman.judul}</h1>
            {halaman.ringkasan && <p className="mt-3 text-blue-100 max-w-2xl">{halaman.ringkasan}</p>}
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose-berita"
              dangerouslySetInnerHTML={{ __html: sanitizeHalamanInfo(halaman.konten) }}
            />

            {halaman.updatedAt && (
              <p className="mt-10 border-t border-gray-100 pt-4 text-xs text-gray-400">
                Terakhir diperbarui:{' '}
                {halaman.updatedAt.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </section>

        {lainnya.length > 0 && (
          <section className="py-12 px-4 bg-brand-surface">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-brand-primary mb-5">Info KIAS lainnya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lainnya.map((h) => (
                  <Link
                    key={h.id}
                    href={`/program/kias/${h.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-secondary hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                      <FileText className="h-5 w-5 text-brand-primary" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-800">{h.judul}</span>
                      {h.ringkasan && (
                        <span className="block text-xs text-gray-500 line-clamp-2">{h.ringkasan}</span>
                      )}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand-primary transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
