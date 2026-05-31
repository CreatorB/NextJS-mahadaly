import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/landing/HeroSection'
import { VisiMisiSection } from '@/components/landing/VisiMisiSection'
import { PengajarSection } from '@/components/landing/PengajarSection'
import { KurikulumSection } from '@/components/landing/KurikulumSection'
import { ProfilLulusanSection } from '@/components/landing/ProfilLulusanSection'
import { JadwalPsbSection } from '@/components/landing/JadwalPsbSection'
import { ContactSection } from '@/components/landing/ContactSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ma'had Aly Al-Imam Asy-Syathiby — PMB 2026/2027",
  description: "Penerimaan Mahasiswa/i Baru Program Studi Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1. Belajar Selama 4 Tahun & Berijazah S1.",
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <VisiMisiSection />
        <PengajarSection />
        <KurikulumSection />
        <ProfilLulusanSection />
        <JadwalPsbSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
