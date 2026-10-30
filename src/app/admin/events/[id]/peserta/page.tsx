import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { eventQuota } from '@/lib/events'
import { suggestPrefix } from '@/lib/export'
import { ExportLink, VcfExportButton } from '@/components/admin/ExportButtons'
import { PesertaRowActions, TambahPeserta } from './PesertaClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Peserta Event — Admin' }

const PER_PAGE = 50

export default async function PesertaPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; gender?: string; status?: string; page?: string }>
}) {
  const id = Number((await params).id)
  const sp = await searchParams
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) notFound()
  const page = Math.max(1, Number(sp.page) || 1)
  const where = {
    eventId: id,
    ...(sp.gender ? { gender: sp.gender } : {}),
    ...(sp.status ? { paymentStatus: sp.status } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }, { phone: { contains: sp.q } }] } : {}),
  }
  const [rows, total, quota] = await Promise.all([
    prisma.eventRegistration.findMany({
      where, orderBy: { registeredAt: 'desc' }, skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      include: { internalLink: { select: { name: true } }, _count: { select: { attendances: true } } },
    }),
    prisma.eventRegistration.count({ where }),
    eventQuota(event),
  ])
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  // Export selalu mengikuti filter yang sedang aktif (q / gender / status).
  const exportUrl = (format: string) => {
    const q = new URLSearchParams({ format })
    for (const k of ['q', 'gender', 'status'] as const) {
      const v = sp[k]
      if (v) q.set(k, v)
    }
    return `/api/admin/events/${id}/export?${q.toString()}`
  }
  const qs = (extra: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, gender: sp.gender, status: sp.status, ...extra })) if (v !== undefined && v !== '') q.set(k, String(v))
    return q.toString()
  }
  const sel = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/events/${id}`} className="text-sm text-gray-500 hover:text-brand-primary">← {event.title}</Link>
          <h1 className="text-2xl font-bold text-brand-primary">Peserta</h1>
          <p className="text-sm text-gray-500">
            Ikhwan {quota.ikhwan}{event.quotaIkhwan != null && ` / ${event.quotaIkhwan}`} · Akhwat {quota.akhwat}{event.quotaAkhwat != null && ` / ${event.quotaAkhwat}`} · {total} hasil filter
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportLink href={exportUrl('xls')} label="Excel" kind="excel" />
          <ExportLink href={exportUrl('csv')} label="CSV" kind="csv" />
          <VcfExportButton
            url={`/api/admin/events/${id}/export`}
            params={{ q: sp.q, gender: sp.gender, status: sp.status }}
            storageKey={`event-${id}`}
            suggestedPrefix={suggestPrefix(event.title, event.startDate)}
            defaultTahun={String(event.startDate.getFullYear())}
            previewNames={rows.map((r) => r.name)}
          />
        </div>
      </div>

      <TambahPeserta eventId={id} />

      <form method="get" className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <select name="gender" defaultValue={sp.gender ?? ''} className={sel} aria-label="Jenis kelamin">
          <option value="">Ikhwan & akhwat</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ''} className={sel} aria-label="Status">
          <option value="">Semua status</option>
          <option value="pending">Menunggu</option>
          <option value="valid">Valid</option>
          <option value="invalid">Ditolak</option>
        </select>
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Cari nama / email / HP" className={`${sel} min-w-56 flex-1`} />
        <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">Terapkan</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>{['Nama', 'Kontak', 'JK', 'Jalur', 'Hadir', 'Bukti', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Tidak ada peserta.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.registeredAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.phone}<span className="block text-xs">{r.email}</span></td>
                <td className="px-4 py-3">{r.gender === 'Laki-Laki' ? 'L' : 'P'}</td>
                <td className="px-4 py-3 text-xs">{r.internalLink ? `Internal: ${r.internalLink.name}` : 'Publik'}</td>
                <td className="px-4 py-3">{r._count.attendances}</td>
                <td className="px-4 py-3">{r.paymentProof ? <a href={`/api/events/bukti/${r.id}`} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Lihat</a> : '-'}</td>
                <td className="px-4 py-3" colSpan={2}><PesertaRowActions eventId={id} registrationId={r.id} status={r.paymentStatus} nama={r.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && <Link href={`?${qs({ page: page - 1 })}`} className="rounded-lg border bg-white px-3 py-1.5">← Sebelumnya</Link>}
          <span className="text-gray-500">Halaman {page} / {pages}</span>
          {page < pages && <Link href={`?${qs({ page: page + 1 })}`} className="rounded-lg border bg-white px-3 py-1.5">Berikutnya →</Link>}
        </div>
      )}
    </div>
  )
}
