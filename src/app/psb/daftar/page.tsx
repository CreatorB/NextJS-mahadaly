import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RegistrationForm } from '@/components/psb/RegistrationForm'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export const metadata: Metadata = { title: "Formulir Pendaftaran — Ma'had Aly Syathiby" }

async function getData() {
  const [programs, pekerjaans] = await Promise.all([
    prisma.program.findMany({ where: { statusPsb: 'Buka' }, orderBy: { id: 'asc' } }),
    prisma.pekerjaan.findMany({ orderBy: { id: 'asc' } }),
  ])
  return { programs, pekerjaans }
}

export default async function DaftarPage() {
  const { programs, pekerjaans } = await getData()

  return (
    <>
      <Toaster richColors />
      <Navbar />
      <main className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary">Formulir Pendaftaran</h1>
          <p className="text-gray-600 mt-2">Ma'had Aly Al-Imam Asy-Syathiby — PMB 2026/2027</p>
        </div>
        <RegistrationForm programs={programs} pekerjaans={pekerjaans} />
      </main>
      <Footer />
    </>
  )
}
