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

function formatHp(kodeNegara: string, noHp: string): string {
  return `+${kodeNegara} ${noHp}`
}

export default async function PendaftaranDetailPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const siswa = await prisma.santri.findUnique({
    where: { kodeRegistrasi: kode },
    include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' } } },
  })
  if (!siswa) notFound()

  const [provinsi, kabupaten, kecamatan] = await Promise.all([
    siswa.provinsiId ? prisma.provinsi.findUnique({ where: { id: siswa.provinsiId } }) : null,
    siswa.kabupatenId ? prisma.kabupatenKota.findUnique({ where: { id: siswa.kabupatenId } }) : null,
    siswa.kecamatanId ? prisma.kecamatan.findUnique({ where: { id: siswa.kecamatanId } }) : null,
  ])

  const fieldGroups = [
    {
      title: 'Data Registrasi',
      fields: [
        { label: 'Kode Registrasi', value: siswa.kodeRegistrasi },
        { label: 'Tahun PSB', value: siswa.tahunPsb },
        { label: 'Program', value: siswa.program.namaProgram },
        { label: 'Tanggal Daftar', value: format(siswa.createdAt, 'dd MMM yyyy, HH:mm', { locale: id }) },
      ],
    },
    {
      title: 'Data Pribadi',
      fields: [
        { label: 'Nama Lengkap', value: siswa.nama },
        { label: 'NIK', value: siswa.nik ?? '-' },
        { label: 'Jenis Kelamin', value: siswa.jk },
        { label: 'Tempat Lahir', value: siswa.tmpLahir },
        { label: 'Tanggal Lahir', value: format(siswa.tglLahir, 'dd MMM yyyy', { locale: id }) },
        { label: 'Pendidikan Terakhir', value: siswa.pendidikan },
        { label: 'Pekerjaan', value: siswa.pekerjaan.nama },
      ],
    },
    {
      title: 'Kontak & Alamat',
      fields: [
        { label: 'Email', value: siswa.email },
        { label: 'No. WhatsApp', value: formatHp(siswa.kodeNegara, siswa.noHp) },
        { label: 'Alamat', value: siswa.alamat },
        { label: 'Provinsi', value: provinsi?.nama ?? '-' },
        { label: 'Kabupaten/Kota', value: kabupaten?.nama ?? '-' },
        { label: 'Kecamatan', value: kecamatan?.nama ?? '-' },
      ],
    },
    {
      title: 'Data Orang Tua / Wali',
      fields: [
        { label: 'Nama Ayah', value: siswa.namaAyah ?? '-' },
        { label: 'No. HP Ayah', value: siswa.noHpAyah ?? '-' },
        { label: 'Nama Ibu', value: siswa.namaIbu ?? '-' },
        { label: 'No. HP Ibu', value: siswa.noHpIbu ?? '-' },
        { label: 'Nama Wali', value: siswa.namaWali ?? '-' },
        { label: 'No. HP Wali', value: siswa.noHpWali ?? '-' },
      ],
    },
    {
      title: 'Data Pembayaran',
      fields: [
        { label: 'Nominal Transfer', value: siswa.nominalTransfer ? `Rp ${Number(siswa.nominalTransfer).toLocaleString('id-ID')}` : '-' },
        { label: 'Tanggal Verifikasi', value: siswa.tglVerifikasi ? format(siswa.tglVerifikasi, 'dd MMM yyyy, HH:mm', { locale: id }) : '-' },
      ],
    },
  ]

  const docs = [
    { label: 'Pas Foto', path: siswa.photo },
    { label: 'KTP', path: siswa.ktp },
    { label: 'Bukti Transfer', path: siswa.transfer },
    { label: 'Ijazah', path: siswa.ijazah },
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
          {statusBadge(siswa.statusPendaftaran)}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
          <span className="text-sm text-gray-500">Status Transfer:</span>
          <Badge variant={siswa.statusTransfer === 'approved' ? 'approved' : siswa.statusTransfer === 'rejected' ? 'rejected' : 'pending'}>
            {siswa.statusTransfer}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <AdminActions
        kode={kode}
        statusPendaftaran={siswa.statusPendaftaran}
        statusTransfer={siswa.statusTransfer}
        nama={siswa.nama}
        hp={siswa.hp}
        email={siswa.email}
      />

      {/* Data Field Groups */}
      {fieldGroups.map((group) => (
        <Card key={group.title}>
          <h3 className="font-semibold text-brand-primary mb-4">{group.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {group.fields.map((f, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-500">{f.label}</span>
                <span className="text-sm font-medium text-gray-900 break-words">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}

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
      {(siswa.alasanTransfer || siswa.alasanPendaftaran) && (
        <Card>
          <h3 className="font-semibold text-brand-primary mb-3">Catatan</h3>
          {siswa.alasanTransfer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
              <p className="text-xs text-red-600 font-medium">Alasan Penolakan Transfer:</p>
              <p className="text-sm text-red-800">{siswa.alasanTransfer}</p>
            </div>
          )}
          {siswa.alasanPendaftaran && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-600 font-medium">Alasan Penolakan Pendaftaran:</p>
              <p className="text-sm text-amber-800">{siswa.alasanPendaftaran}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
