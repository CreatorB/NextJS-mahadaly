import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { RegistrationForm } from '@/components/psb/RegistrationForm'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { Link2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { validateRegistrationLink } from '@/lib/registration-link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: "Formulir Pendaftaran — Ma'had Aly Syathiby" }

async function getData() {
  const [infoPsb, programs, pekerjaans] = await Promise.all([
    prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } }),
    prisma.program.findMany({ where: { statusPsb: 'Buka' }, orderBy: { id: 'asc' } }),
    prisma.pekerjaan.findMany({ orderBy: { id: 'asc' } }),
  ])
  return { infoPsb, programs, pekerjaans }
}

export default async function DaftarPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  let specialLink: Awaited<ReturnType<typeof validateRegistrationLink>> | null = null
  if (params.ref) {
    specialLink = await validateRegistrationLink(params.ref)
    if (!specialLink.ok) notFound()
  }
  const linkData = specialLink && specialLink.ok ? specialLink : null

  const { infoPsb, programs, pekerjaans } = await getData()

  const now = new Date()
  const isOpen =
    !!infoPsb &&
    infoPsb.statusPsb === 'Buka' &&
    (!infoPsb.datetimeOpen || infoPsb.datetimeOpen <= now) &&
    (!infoPsb.datetimeClosed || infoPsb.datetimeClosed >= now)

  // Tautan khusus boleh dipakai walaupun PSB sudah tutup (untuk pendaftar susulan).
  if (!isOpen && !linkData) {
    redirect('/psb?closed=1')
  }

  return (
    <>
      <Toaster richColors />
      <Navbar />
      <main className="min-h-screen bg-brand-surface py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary">Formulir Pendaftaran</h1>
          <p className="text-gray-600 mt-2">Ma'had Aly Al-Imam Asy-Syathiby — PMB 2026/2027</p>
        </div>
        {linkData && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Link2 className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-amber-900">Pendaftaran via Tautan Khusus</p>
                  {linkData.remainingQuota !== null && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Sisa {linkData.remainingQuota}/{linkData.link.quota} kuota
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-amber-800">{linkData.link.label}</p>
                {!isOpen && (
                  <p className="mt-1 text-xs text-amber-700">
                    PSB reguler sudah ditutup, tetapi Anda tetap dapat mendaftar melalui tautan ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <RegistrationForm programs={programs} pekerjaans={pekerjaans} refSlug={linkData?.link.slug ?? null} />
      </main>
      <Footer />
    </>
  )
}
