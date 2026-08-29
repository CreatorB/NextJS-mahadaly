import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { LinkForm } from '../create/LinkForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit Link Pendaftaran — Admin' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditLinkPendaftaranPage({ params }: Props) {
  const { id } = await params
  const linkId = parseInt(id)
  if (!Number.isFinite(linkId)) notFound()

  const link = await prisma.registrationLink.findUnique({ where: { id: linkId } })
  if (!link) notFound()

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-primary mb-2">Edit Link Pendaftaran</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ubah label, kuota, atau masa berlaku. Slug bisa diganti selama belum dipakai link lain.
      </p>
      <LinkForm
        mode="edit"
        initial={{
          id: link.id,
          slug: link.slug,
          label: link.label,
          quota: link.quota,
          expiresAt: link.expiresAt?.toISOString() ?? null,
          isActive: link.isActive,
        }}
      />
    </div>
  )
}
