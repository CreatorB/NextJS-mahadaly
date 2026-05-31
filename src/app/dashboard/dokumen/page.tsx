import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { FileImage, FileText, ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dokumen — Ma\'had Aly Syathiby' }

export default async function DokumenPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { santri: true } })
  if (!user?.santri) redirect('/dashboard')

  const santri = user.santri
  const docs = [
    { label: 'Pas Foto', path: santri.photo, icon: FileImage },
    { label: 'KTP / Kartu Identitas', path: santri.ktp, icon: FileImage },
    { label: 'Bukti Transfer', path: santri.transfer, icon: FileImage },
    { label: 'Ijazah', path: santri.ijazah, icon: FileText },
  ]

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-brand-primary mb-6">Dokumen Saya</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docs.map((doc, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4">
              <div className="bg-brand-primary/10 rounded-xl p-3">
                <doc.icon className="h-6 w-6 text-brand-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{doc.label}</p>
                {doc.path ? (
                  <a href={doc.path} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-secondary hover:underline flex items-center gap-1">
                    Lihat File <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Belum diupload</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
