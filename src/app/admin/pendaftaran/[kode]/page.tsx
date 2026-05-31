import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { AdminActions } from '@/components/admin/AdminActions'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ kode: string }> }): Promise<Metadata> {
  const { kode } = await params
  return { title: `Pendaftar ${kode} — Admin Ma'had Aly Syathiby` }
}

export default async function PendaftaranDetailPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const santri = await prisma.santri.findUnique({
    where: { kodeRegistrasi: kode },
    include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' } } },
  })
  if (!santri) notFound()

  const fields = [
    { label: 'Kode Registrasi', value: santri.kodeRegistrasi },
    { label: 'Nama', value: santri.nama },
    { label: 'NIK', value: santri.nik ?? '-' },
    { label: 'NISN', value: santri.nisn ?? '-' },
    { label: 'Jenis Kelamin', value: santri.jk },
    { label: 'Tempat Lahir', value: santri.tmpLahir },
    { label: 'Tanggal Lahir', value: format(santri.tglLahir, 'dd MMM yyyy', { locale: id }) },
    { label: 'Alamat', value: santri.alamat },
    { label: 'Email', value: santri.email },
    { label: 'No. WA', value: `+${santri.kodeNegara}${santri.noHp}` },
    { label: 'Pendidikan', value: santri.pendidikan },
    { label: 'Pekerjaan', value: santri.pekerjaan.nama },
    { label: 'Program', value: santri.program.namaProgram },
    { label: 'Nama Ayah', value: santri.namaAyah ?? '-' },
    { label: 'Nama Ibu', value: santri.namaIbu ?? '-' },
    { label: 'Nama Wali', value: santri.namaWali ?? '-' },
    { label: 'Nominal Transfer', value: santri.nominalTransfer ? `Rp ${Number(santri.nominalTransfer).toLocaleString('id-ID')}` : '-' },
  ]

  const docs = [
    { label: 'Pas Foto', path: santri.photo, type: 'image' },
    { label: 'KTP', path: santri.ktp, type: 'image' },
    { label: 'Bukti Transfer', path: santri.transfer, type: 'image' },
    { label: 'Ijazah', path: santri.ijazah, type: 'auto' },
  ]

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pendaftaran" className="text-sm text-brand-secondary hover:underline">← Kembali</Link>
        <h1 className="text-2xl font-bold text-brand-primary">Detail Pendaftar</h1>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
          <span className="text-sm text-gray-500">Status Pendaftaran:</span>
          {statusBadge(santri.statusPendaftaran)}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
          <span className="text-sm text-gray-500">Status Transfer:</span>
          <Badge variant={santri.statusTransfer === 'approved' ? 'approved' : santri.statusTransfer === 'rejected' ? 'rejected' : 'pending'}>
            {santri.statusTransfer}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <AdminActions kode={kode} statusPendaftaran={santri.statusPendaftaran} statusTransfer={santri.statusTransfer} />

      {/* Data Fields */}
      <Card>
        <h3 className="font-semibold text-brand-primary mb-4">Data Pendaftar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">{f.label}</span>
              <span className="text-sm font-medium text-gray-900 break-words">{f.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Documents */}
      <Card>
        <h3 className="font-semibold text-brand-primary mb-4">Dokumen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map((doc, i) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <div className="bg-brand-surface px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium">{doc.label}</span>
                {doc.path && (
                  <a href={doc.path} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-secondary hover:underline">
                    Buka Baru
                  </a>
                )}
              </div>
              {doc.path ? (
                doc.path.endsWith('.pdf') ? (
                  <iframe src={doc.path} className="w-full h-48" title={doc.label} />
                ) : (
                  <img src={doc.path} alt={doc.label} className="w-full h-48 object-contain bg-gray-50" />
                )
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Belum diupload</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Reasons */}
      {(santri.alasanTransfer || santri.alasanPendaftaran) && (
        <Card>
          <h3 className="font-semibold text-brand-primary mb-3">Catatan</h3>
          {santri.alasanTransfer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
              <p className="text-xs text-red-600 font-medium">Alasan Penolakan Transfer:</p>
              <p className="text-sm text-red-800">{santri.alasanTransfer}</p>
            </div>
          )}
          {santri.alasanPendaftaran && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-medium">Alasan Penolakan Pendaftaran:</p>
              <p className="text-sm text-amber-800">{santri.alasanPendaftaran}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
