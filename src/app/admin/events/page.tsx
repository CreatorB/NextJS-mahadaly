import Link from 'next/link'
import { Plus, Users, ClipboardCheck, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'
import { EVENT_STATUS_LABEL, isEventRegistrationOpen } from '@/lib/events'
import { suggestPrefix } from '@/lib/export'
import { ExportLink, VcfExportButton } from '@/components/admin/ExportButtons'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Event — Admin' }

export default async function AdminEventsPage() {
  const [events, sampleParticipants] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { registrations: true, internalLinks: true } } },
    }),
    prisma.eventRegistration.findMany({
      select: { name: true },
      orderBy: { registeredAt: 'asc' },
      take: 3,
    }),
  ])

  // Saran prefix untuk VCF: dari event paling baru (mis. "Kajian Umum Islam" 31 → KUI31).
  const terbaru = events[0]
  const prefixSaran = terbaru ? suggestPrefix(terbaru.title, terbaru.startDate) : ''
  const tahunSaran = terbaru ? String(terbaru.startDate.getFullYear()) : String(new Date().getFullYear())

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Event</h1>
          <p className="text-sm text-gray-500">Daurah & kajian (dipindahkan dari KIAS). Halaman publik: /events</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportLink href="/api/admin/events/export?format=xls" label="Export Excel" kind="excel" />
          <ExportLink href="/api/admin/events/export?format=csv" label="Export CSV" kind="csv" />
          <VcfExportButton
            url="/api/admin/events/export"
            storageKey="events-semua"
            suggestedPrefix={prefixSaran}
            defaultTahun={tahunSaran}
            previewNames={sampleParticipants.map((p) => p.name)}
          />
          <Link href="/admin/events/baru" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Event baru
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              {['Event', 'Tanggal', 'Status', 'Pendaftaran', 'Peserta', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Belum ada event.</td></tr>}
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${e.id}`} className="font-medium text-brand-primary hover:underline">{e.title}</Link>
                  <span className="block font-mono text-xs text-gray-400">/events/{e.slug}{e._count.internalLinks ? ` · ${e._count.internalLinks} link internal` : ''}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="px-4 py-3">{EVENT_STATUS_LABEL[e.status] ?? e.status}</td>
                <td className="px-4 py-3">{isEventRegistrationOpen(e) ? <span className="text-green-700 font-semibold">Dibuka</span> : <span className="text-gray-500">Tutup</span>}</td>
                <td className="px-4 py-3">{e._count.registrations}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3 text-gray-500">
                    <Link href={`/admin/events/${e.id}/peserta`} title="Peserta" className="hover:text-brand-primary"><Users className="h-4 w-4" /></Link>
                    {e.hasAttendance && <Link href={`/admin/events/${e.id}/absensi`} title="Absensi" className="hover:text-brand-primary"><ClipboardCheck className="h-4 w-4" /></Link>}
                    {e.status !== 'draft' && <a href={`/events/${e.slug}`} target="_blank" rel="noopener noreferrer" title="Lihat" className="hover:text-brand-primary"><ExternalLink className="h-4 w-4" /></a>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
