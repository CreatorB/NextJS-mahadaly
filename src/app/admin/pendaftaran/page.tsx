import prisma from '@/lib/prisma'
import { Badge, statusBadge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran — Admin Ma\'had Aly Syathiby' }

interface Props {
  searchParams: Promise<{
    page?: string; search?: string; statusPendaftaran?: string
    statusTransfer?: string; programId?: string; jk?: string
  }>
}

export default async function PendaftaranPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 15
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (params.search) {
    where.OR = [{ nama: { contains: params.search } }, { kodeRegistrasi: { contains: params.search } }]
  }
  if (params.statusPendaftaran) where.statusPendaftaran = params.statusPendaftaran
  if (params.statusTransfer) where.statusTransfer = params.statusTransfer
  if (params.programId) where.programId = parseInt(params.programId)
  if (params.jk) where.jk = params.jk

  const [total, santris, programs] = await Promise.all([
    prisma.santri.count({ where }),
    prisma.santri.findMany({ where, include: { program: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.program.findMany(),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-primary">Data Pendaftaran</h1>
        <span className="text-sm text-gray-500">Total: {total}</span>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input name="search" defaultValue={params.search} placeholder="Cari nama/kode..." className="col-span-2 sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        <select name="statusPendaftaran" defaultValue={params.statusPendaftaran} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Diterima</option>
          <option value="rejected">Ditolak</option>
        </select>
        <select name="statusTransfer" defaultValue={params.statusTransfer} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Transfer</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select name="jk" defaultValue={params.jk} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua JK</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900">Filter</button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kode</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">JK</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Program</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pendaftaran</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Transfer</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {santris.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
            )}
            {santris.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-brand-primary">{s.kodeRegistrasi}</td>
                <td className="px-4 py-3 font-medium">{s.nama}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.jk === 'Laki-Laki' ? 'info' : 'default'}>{s.jk === 'Laki-Laki' ? 'Ikhwan' : 'Akhwat'}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px] truncate">{s.program.namaProgram}</td>
                <td className="px-4 py-3">{statusBadge(s.statusPendaftaran)}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.statusTransfer === 'approved' ? 'approved' : s.statusTransfer === 'rejected' ? 'rejected' : 'pending'}>
                    {s.statusTransfer}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{format(s.createdAt, 'dd/MM/yy')}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pendaftaran/${s.kodeRegistrasi}`} className="text-brand-secondary hover:underline text-xs font-medium">Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <a key={i} href={`?page=${i + 1}&search=${params.search ?? ''}&statusPendaftaran=${params.statusPendaftaran ?? ''}&statusTransfer=${params.statusTransfer ?? ''}&jk=${params.jk ?? ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-brand-primary'}`}>
              {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
