import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HkiProgramDetail } from '@/components/program/HkiProgramDetail'
import { KiasProgramDetail } from '@/components/program/KiasProgramDetail'
import { getCatalogProgram } from '@/lib/program-catalog'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

const DESKRIPSI: Record<string, string> = {
  hki: "Program Ma'had Aly Hukum Keluarga Islam (HKI) S1: belajar ilmu-ilmu syar'i 4 tahun untuk Santri & mahasiswa/i yang sudah bisa berbahasa Arab pasif, lengkap dengan panduan akademik, kalender pendidikan, dan info pendaftaran.",
  kias: "Program KIAS Ma'had Aly Asy-Syathiby: kursus bertahap Tajwid Al-Qur'an, bahasa Arab, hingga ilmu syar'i. Tanpa syarat ijazah, untuk ikhwan & akhwat.",
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const program = await getCatalogProgram(slug)
  if (!program) return { title: 'Program tidak ditemukan' }

  const description =
    DESKRIPSI[slug] ??
    program.ringkasan ??
    `Program ${program.nama} di Ma'had Aly Al-Imam Asy-Syathiby.`

  return {
    // Template title root sudah menambah "— Ma'had Aly Asy-Syathiby",
    // jadi di sini cukup nama programnya (agar tidak dobel).
    title: program.nama,
    description,
    alternates: { canonical: `/program/${slug}` },
    openGraph: {
      title: `${program.nama} — Ma'had Aly Asy-Syathiby`,
      description,
      url: `/program/${slug}`,
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
      title: `${program.nama} — Ma'had Aly Asy-Syathiby`,
      description,
      images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
    },
  }
}

export default async function ProgramPage({ params, searchParams }: Params & {
  searchParams: Promise<{ id?: string }>
}) {
  const { slug } = await params
  const program = await getCatalogProgram(slug)
  if (!program) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.nama,
    description: program.ringkasan ?? DESKRIPSI[slug] ?? '',
    url: `/program/${slug}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: "Ma'had Aly Al-Imam Asy-Syathiby",
      url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id',
    },
    ...(program.jenjang ? { educationalCredentialAwarded: program.jenjang } : {}),
  }

  return (
    <>
      <Navbar />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {program.jenisSistem === 'kias' ? (
          <KiasProgramDetail />
        ) : (
          <HkiProgramDetail searchParams={searchParams} />
        )}
      </main>
      <Footer />
    </>
  )
}
