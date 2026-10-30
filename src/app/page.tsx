import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { VisiMisiSection } from '@/components/landing/VisiMisiSection'
import { PengajarSection } from '@/components/landing/PengajarSection'
import { ProfilLulusanSection } from '@/components/landing/ProfilLulusanSection'
import { ContactSection } from '@/components/landing/ContactSection'
import { ProgramPricingSection } from '@/components/landing/ProgramPricingSection'
import { BeritaEventSection } from '@/components/berita/BeritaEventSection'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Ma'had Aly Al-Imam Asy-Syathiby",
    description:
      "Ma'had Aly Al-Imam Asy-Syathiby — pusat kajian ilmu syar'i & bahasa Arab di Cileungsi, Bogor. Program Hukum Keluarga Islam (HKI) S1 berijazah 4 tahun dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i) untuk ikhwan & akhwat.",
    alternates: { canonical: '/' },
    openGraph: {
      title: "Ma'had Aly Al-Imam Asy-Syathiby",
      description:
        "Pusat kajian ilmu syar'i & bahasa Arab. Program Hukum Keluarga Islam (HKI) S1 berijazah 4 tahun dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i).",
      url: '/',
      siteName: "Ma'had Aly Al-Imam Asy-Syathiby",
      locale: 'id_ID',
      type: 'website',
      // openGraph di level halaman MENGGANTIKAN object root, jadi images
      // harus ditulis ulang di sini (tidak di-merge otomatis).
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
      title: "Ma'had Aly Al-Imam Asy-Syathiby",
      description:
        "Pusat kajian ilmu syar'i & bahasa Arab. Program HKI S1 berijazah dan KIAS.",
      images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
    },
    robots: isStaging
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  }
}

export default async function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${APP_URL}/#organisasi`,
        name: "Ma'had Aly Al-Imam Asy-Syathiby",
        url: APP_URL,
        logo: `${APP_URL}/images/mahadalysyathiby-logo-color.png`,
        description:
          "Ma'had Aly Al-Imam Asy-Syathiby — pusat kajian ilmu syar'i & bahasa Arab di Cileungsi, Bogor.",
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Cileungsi',
          addressRegion: 'Bogor',
          addressCountry: 'ID',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+62-811-1516-756',
          contactType: 'admissions',
          availableLanguage: ['id'],
        },
        sameAs: [
          'https://www.instagram.com/mahadalysyathiby',
          'https://github.com/CreatorB/NextJS-mahadaly',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${APP_URL}/#website`,
        url: APP_URL,
        name: "Ma'had Aly Al-Imam Asy-Syathiby",
        inLanguage: 'id-ID',
        publisher: { '@id': `${APP_URL}/#organisasi` },
      },
    ],
  }

  return (
    <>
      <Navbar />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HeroSection />
        {/* Kabar & agenda terbaru: satu section di depan, sebelum "Program Belajar". */}
        <BeritaEventSection />
        <ProgramPricingSection />
        <VisiMisiSection />
        <PengajarSection />
        <ProfilLulusanSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
