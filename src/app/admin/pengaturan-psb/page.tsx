import prisma from '@/lib/prisma'
import { PsbSettingsForm } from '@/components/admin/PsbSettingsForm'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pengaturan PSB — Admin' }

export default async function PengaturanPsbPage() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  return (
    <>
      <Toaster richColors />
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-brand-primary mb-6">Pengaturan PSB</h1>
        {info ? <PsbSettingsForm info={info as unknown as Record<string, unknown>} /> : <p className="text-gray-500">Data PSB tidak ditemukan.</p>}
      </div>
    </>
  )
}
