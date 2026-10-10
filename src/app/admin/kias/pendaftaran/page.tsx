import Link from 'next/link'
import { Download, UserPlus } from 'lucide-react'
import prisma from '@/lib/prisma'
import { defaultKiasTahun, KIAS_STATUS_PENDAFTARAN, KIAS_STATUS_TRANSFER, kiasFilterFromParams, kiasWhere } from '@/lib/kias-admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pendaftar KIAS — Admin' }

const PER_PAGE = 25
const badge: Record<string, string> = {
  Menunggu: 'bg-yellow-100 text-yellow-800', Diterima: 'bg-green-100 text-green-800', Ditolak: 'bg-red-100 text-red-800',
  Cek: 'bg-orange-100 text-orange-800', Valid: 'bg-green-100 text-green-800', Invalid: 'bg-red-100 text-red-800',
}

export default async function AdminKiasPendaftaranPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const filter = kiasFilterFromParams(sp)
  if (!filter.tahun) filter.tahun = (await defaultKiasTahun()) ?? undefined
  const page = Math.max(1, Number(sp.page) || 1)
  const where = kiasWhere(filter)

  const [rows, total, tahunList, kelas] = await Promise.all([
    prisma.kiasSantri.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      include: { program: true },
    }),
    prisma.kiasSantri.count({ where }),
    prisma.kiasInfoPsb.findMany({ orderBy: { id: 'desc' }, select: { tahunAjaran: true } }),
    prisma.kiasProgram.findMany({ orderBy: { id: 'asc' }, select: { id: true, namaProgram: true } }),
  ])
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const qs = (extra: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...filter, ...extra })) if (v !== undefined && v !== '') q.set(k, String(v))
    return q.toString()
  }
  const sel = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/kias" className="text-sm text-gray-500 hover:text-brand-primary">← KIAS</Link>
          <h1 className="text-2xl font-bold text-brand-primary">Pendaftar KIAS</h1>
          <p className="text-sm text-gray-500">{total} data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['csv', 'xls', 'vcf'] as const).map((f) => (
            <a key={f} href={`/api/admin/kias/export?${qs({ format: f })}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
              <Download className="h-4 w-4" /> {f === 'xls' ? 'Excel' : f.toUpperCase()}
            </a>
          ))}
          <Link href="/admin/kias/pendaftaran/tambah" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90">
            <UserPlus className="h-4 w-4" /> Tambah
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <select name="tahun" defaultValue={filter.tahun} className={sel} aria-label="Tahun">
          {tahunList.map((t) => <option key={t.tahunAjaran} value={t.tahunAjaran}>TA {t.tahunAjaran}</option>)}
        </select>
        <select name="status" defaultValue={filter.status ?? ''} className={sel} aria-label="Status pendaftaran">
          <option value="">Semua status</option>
          {KIAS_STATUS_PENDAFTARAN.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="transfer" defaultValue={filter.transfer ?? ''} className={sel} aria-label="Status transfer">
          <option value="">Semua transfer</option>
          {KIAS_STATUS_TRANSFER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="program" defaultValue={filter.program ?? ''} className={sel} aria-label="Kelas">
          <option value="">Semua kelas</option>
          {kelas.map((k) => <option key={k.id} value={k.id}>{k.namaProgram}</option>)}
        </select>
        <select name="jk" defaultValue={filter.jk ?? ''} className={sel} aria-label="Jenis kelamin">
          <option value="">Ikhwan & akhwat</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        <input name="q" defaultValue={filter.q ?? ''} placeholder="Cari nama / kode / email / HP" className={`${sel} min-w-56 flex-1`} />
        <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white">Terapkan</button>
        <Link href="/admin/kias/pendaftaran" className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-brand-primary">Reset</Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              {['Kode', 'Nama', 'JK', 'Kelas', 'Pendaftaran', 'Transfer', 'Tgl Daftar'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Tidak ada data.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.kodeRegistrasi}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/kias/pendaftaran/${r.kodeRegistrasi}`} className="font-medium text-brand-primary hover:underline">{r.nama}</Link>
                  <span className="block text-xs text-gray-500">{r.hp ? `+${r.hp}` : r.email}</span>
                </td>
                <td className="px-4 py-3">{r.jk === 'Laki-Laki' ? 'L' : 'P'}</td>
                <td className="px-4 py-3">{r.program?.namaProgram ?? '-'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[r.statusPendaftaran] ?? ''}`}>{r.statusPendaftaran}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[r.statusTransfer] ?? ''}`}>{r.statusTransfer}</span></td>
                <td className="px-4 py-3 text-gray-600">{r.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
