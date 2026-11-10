import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { KiasProgramDetail } from '@/components/program/KiasProgramDetail'
import { getCatalogProgram } from '@/lib/program-catalog'

export const dynamic = 'force-dynamic'

const DESKRIPSI =
  "Program KIAS Ma'had Aly Asy-Syathiby: kursus bertahap Tajwid Al-Qur'an, bahasa Arab, hingga ilmu syar'i. Tanpa syarat ijazah, untuk ikhwan & akhwat."

/**
 * Halaman program KIAS (URL kanonik /program/kias).
 *
 * Dipisah dari /program/[slug] supaya KIAS bisa punya sub-halaman informasinya
 * sendiri (/program/kias/[slug]) tanpa bentrok dengan route dinamis.
 */
export async function generateMetadata(): Promise<Metadata> {
  const program = await getCatalogProgram('kias')
  return {
    title: program?.nama ?? 'KIAS — Asy-Syathiby',
    description: DESKRIPSI,
    alternates: { canonical: '/program/kias' },
    openGraph: {
      title: program?.nama ?? 'KIAS — Asy-Syathiby',
      description: DESKRIPSI,
      url: '/program/kias',
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
    twitter: {
      card: 'summary_large_image',
      title: program?.nama ?? 'KIAS — Asy-Syathiby',
      description: DESKRIPSI,
      images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
    },
  }
}

export default async function ProgramKiasPage() {
  return (
    <>
      <Navbar />
      <main>
        <KiasProgramDetail />
      </main>
      <Footer />
    </>
  )
}
