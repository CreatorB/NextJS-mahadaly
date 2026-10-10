import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { VisiMisiSection } from '@/components/landing/VisiMisiSection'
import { PengajarSection } from '@/components/landing/PengajarSection'
import { MateriSection } from '@/components/landing/MateriSection'
import { ProfilLulusanSection } from '@/components/landing/ProfilLulusanSection'
import { ContactSection } from '@/components/landing/ContactSection'
import { ProgramPricingSection } from '@/components/landing/ProgramPricingSection'
import { BeritaSection } from '@/components/berita/BeritaSection'
import prisma from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  const tahun = info?.tahunAjaran ?? '2026'
  const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false
  return {
    title: `Ma'had Aly Al-Imam Asy-Syathiby — PMB ${tahun}/${Number(tahun) + 1}`,
    description: "Penerimaan santri & mahasiswa baru Asy-Syathiby: Program 1 Hukum Keluarga Islam (HKI) S1 berijazah, Program 2 KIAS (Kursus Ilmu bahasa Arab & Syar'i).",
    robots: isStaging
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  }
}

export default async function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProgramPricingSection />
        <VisiMisiSection />
        <PengajarSection />
        <MateriSection />
        <ProfilLulusanSection />
        <BeritaSection kategori="mahadaly" instagram="mahadalysyathiby" subtitle="Kabar kegiatan Ma'had Aly Al-Imam Asy-Syathiby" />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}