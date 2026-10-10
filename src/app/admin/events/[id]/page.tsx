import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Users, ClipboardCheck } from 'lucide-react'
import prisma from '@/lib/prisma'
import { eventImages } from '@/lib/events'
import { EventForm } from '../EventForm'
import { InternalLinks } from './InternalLinks'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit Event — Admin' }

const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const e = await prisma.event.findUnique({
    where: { id },
    include: { internalLinks: { orderBy: { id: 'asc' } }, _count: { select: { registrations: true } } },
  })
  if (!e) notFound()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/events" className="text-sm text-gray-500 hover:text-brand-primary">← Event</Link>
          <h1 className="text-2xl font-bold text-brand-primary">{e.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/events/${e.id}/peserta`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <Users className="h-4 w-4" /> Peserta ({e._count.registrations})
          </Link>
          {e.hasAttendance && (
            <Link href={`/admin/events/${e.id}/absensi`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
              <ClipboardCheck className="h-4 w-4" /> Absensi
            </Link>
          )}
        </div>
      </div>
      <EventForm
        initial={{
          id: e.id, title: e.title, slug: e.slug, content: e.content, images: eventImages(e.images),
          startDate: local(e.startDate), endDate: local(e.endDate), registrationStart: local(e.registrationStart), registrationEnd: local(e.registrationEnd),
          isPaid: e.isPaid, price: String(e.price), hasAttendance: e.hasAttendance, hasCertificate: e.hasCertificate, status: e.status,
          groupIkhwan: e.groupIkhwan ?? '', groupAkhwat: e.groupAkhwat ?? '', groupPublic: e.groupPublic ?? '',
          quotaIkhwan: e.quotaIkhwan?.toString() ?? '', quotaAkhwat: e.quotaAkhwat?.toString() ?? '', autoAccept: e.autoAccept,
        }}
      />
      <InternalLinks
        eventId={e.id}
        baseUrl={`${baseUrl}/events/internal/${e.slug}`}
        links={e.internalLinks.map((l) => ({
          id: l.id, name: l.name, token: l.token, quotaIkhwan: l.quotaIkhwan, quotaAkhwat: l.quotaAkhwat,
          usageIkhwan: l.usageIkhwan, usageAkhwat: l.usageAkhwat,
          activeFrom: l.activeFrom?.toISOString() ?? null, activeUntil: l.activeUntil?.toISOString() ?? null,
        }))}
      />
    </div>
  )
}
