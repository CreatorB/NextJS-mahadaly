import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download } from 'lucide-react'
import prisma from '@/lib/prisma'
import { AbsensiToggle, PrintButton } from './AbsensiClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Absensi Event — Admin' }

function todayWib() {
  const wib = new Date(Date.now() + 7 * 3600000)
  const start = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600000)
  return { start, end: new Date(start.getTime() + 86400000) }
}

export default async function AbsensiPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; gender?: string }> }) {
  const id = Number((await params).id)
  const sp = await searchParams
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) notFound()
  const { start, end } = todayWib()
  const rows = await prisma.eventRegistration.findMany({
    where: {
      eventId: id, paymentStatus: 'valid',
      ...(sp.gender ? { gender: sp.gender } : {}),
      ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { phone: { contains: sp.q } }] } : {}),
    },
    orderBy: { name: 'asc' },
    include: { attendances: { orderBy: { attendedAt: 'desc' } } },
  })
  const hadirHariIni = rows.filter((r) => r.attendances.some((a) => a.attendedAt >= start && a.attendedAt < end)).length
  const sel = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="p-6 sm:p-8 space-y-5 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/events/${id}`} className="text-sm text-gray-500 hover:text-brand-primary print:hidden">← {event.title}</Link>
          <h1 className="text-2xl font-bold text-brand-primary">Absensi — {event.title}</h1>
          <p className="text-sm text-gray-500">
            {start.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · hadir hari ini {hadirHariIni} dari {rows.length} peserta valid
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <a href={`/api/admin/events/${id}/export?format=xls`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"><Download className="h-4 w-4" /> Excel</a>
          <PrintButton />
        </div>
      </div>
      <form method="get" className="flex flex-wrap gap-2 print:hidden">
        <select name="gender" defaultValue={sp.gender ?? ''} className={sel} aria-label="Jenis kelamin">
          <option value="">Ikhwan & akhwat</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Cari nama / HP" className={`${sel} min-w-56 flex-1`} autoFocus />
        <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">Cari</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm print:border-0 print:shadow-none">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>{['No', 'Nama', 'JK', 'No. HP', 'Total hadir', 'Terakhir hadir', 'Hadir hari ini'].map((h) => <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => {
              const hariIni = r.attendances.some((a) => a.attendedAt >= start && a.attendedAt < end)
              return (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-2">{r.gender === 'Laki-Laki' ? 'L' : 'P'}</td>
                  <td className="px-4 py-2 text-gray-600">{r.phone}</td>
                  <td className="px-4 py-2">{r.attendances.length}</td>
                  <td className="px-4 py-2 text-gray-600">{r.attendances[0] ? r.attendances[0].attendedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }) : '-'}</td>
                  <td className="px-4 py-2"><AbsensiToggle eventId={id} registrationId={r.id} hadir={hariIni} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
