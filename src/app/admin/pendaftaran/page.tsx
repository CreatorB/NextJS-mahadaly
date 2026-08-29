import prisma from '@/lib/prisma'
import { Users, Clock, CheckCircle, Banknote, FileSpreadsheet, FileText, Contact, UserPlus } from 'lucide-react'
import type { Metadata } from 'next'
import { PendaftaranTable, CsvUploadButton, DownloadKelulusanButton, type PendaftaranRow } from './PendaftaranTable'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran — Admin Ma\'had Aly Syathiby' }

interface Props {
  searchParams: Promise<{
    page?: string; search?: string; statusPendaftaran?: string
    statusTransfer?: string; programId?: string; jk?: string
    kelulusan?: string
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
  if (params.kelulusan) where.kelulusan = params.kelulusan

  const [total, pendingCount, approvedCount, rejected, lulusCount, cash, pendingTransfer, santris, programs] = await Promise.all([
    prisma.santri.count(),
    prisma.santri.count({ where: { statusPendaftaran: 'pending' } }),
    prisma.santri.count({ where: { statusPendaftaran: 'approved' } }),
    prisma.santri.count({ where: { statusPendaftaran: 'rejected' } }),
    prisma.santri.count({ where: { kelulusan: 'lulus' } }),
    prisma.santri.aggregate({ _sum: { nominalTransfer: true }, where: { statusTransfer: 'approved' } }),
    prisma.santri.count({ where: { statusTransfer: 'pending' } }),
    prisma.santri.findMany({ where: { ...where }, include: { program: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.program.findMany(),
  ])

  const totalCash = cash._sum.nominalTransfer ? Number(cash._sum.nominalTransfer) : 0
  const totalPages = Math.ceil(total / limit)

  const rows: PendaftaranRow[] = santris.map((s) => ({
    id: s.id,
    kodeRegistrasi: s.kodeRegistrasi,
    nama: s.nama,
    jk: s.jk,
    programNama: s.program.namaProgram,
    statusPendaftaran: s.statusPendaftaran,
    statusTransfer: s.statusTransfer,
    kelulusan: s.kelulusan,
    predikat: s.predikat,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-primary">Data Pendaftaran</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/admin/pendaftaran/create"
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
            title="Tambah pendaftaran secara manual (untuk susulan / kuota dadakan) meskipun PSB sudah ditutup"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Pendaftaran
          </a>
          <DownloadKelulusanButton />
          <CsvUploadButton />
          <a
            href="/api/admin/santri/export/excel"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            title="Download data lengkap dalam format Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </a>
          <a
            href="/api/admin/santri/export/csv"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            title="Download data lengkap dalam format CSV"
          >
            <FileText className="h-4 w-4" />
            Export CSV
          </a>
          <a
            href="/api/admin/santri/export/vcf"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            title="Download kontak semua Mahasantri (format vCard) untuk di-import ke HP admin"
          >
            <Contact className="h-4 w-4" />
            Export Kontak (.vcf)
          </a>
        </div>
      </div>

      <div className="bg-brand-primary rounded-xl p-4 flex flex-wrap gap-4 sm:gap-8">
        <div className="flex items-center gap-2 text-white">
          <Banknote className="h-4 w-4" />
          <span className="text-sm">Cash</span>
          <span className="text-xl font-bold">Rp {totalCash.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Users className="h-4 w-4" />
          <span className="text-sm">Total</span>
          <span className="text-xl font-bold">{total}</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-300">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Pending</span>
          <span className="text-xl font-bold">{pendingTransfer}</span>
        </div>
        <div className="flex items-center gap-2 text-green-300">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Diterima</span>
          <span className="text-xl font-bold">{approvedCount}</span>
        </div>
        <div className="flex items-center gap-2 text-amber-300">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Lulus</span>
          <span className="text-xl font-bold">{lulusCount}</span>
        </div>
      </div>

      <form className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <input name="search" defaultValue={params.search} placeholder="Cari nama/kode..." className="col-span-2 sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        <select name="statusPendaftaran" defaultValue={params.statusPendaftaran} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Pendaftaran</option>
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
        <select name="kelulusan" defaultValue={params.kelulusan} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua Kelulusan</option>
          <option value="lulus">Lulus</option>
          <option value="tidak_lulus">Tidak Lulus</option>
        </select>
        <select name="jk" defaultValue={params.jk} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Semua JK</option>
          <option value="Laki-Laki">Ikhwan</option>
          <option value="Perempuan">Akhwat</option>
        </select>
        <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 sm:col-span-1">Filter</button>
      </form>

      {/* Table */}
      <PendaftaranTable rows={rows} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <a key={i} href={`?page=${i + 1}&search=${params.search ?? ''}&statusPendaftaran=${params.statusPendaftaran ?? ''}&statusTransfer=${params.statusTransfer ?? ''}&jk=${params.jk ?? ''}&kelulusan=${params.kelulusan ?? ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-brand-primary'}`}>
              {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
