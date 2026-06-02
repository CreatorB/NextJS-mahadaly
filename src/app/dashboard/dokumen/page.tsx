import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { RevisiDokumen } from '@/components/dashboard/RevisiDokumen'
import { Lock, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dokumen — Ma\'had Aly Syathiby' }

export default async function DokumenPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { siswa: true } })
  if (!user?.siswa) redirect('/dashboard')

  const siswa = user.siswa
  const isFullyApproved = siswa.statusPendaftaran === 'approved'
  const isTransferApproved = siswa.statusTransfer === 'approved'
  const isTransferRejected = siswa.statusTransfer === 'rejected'

  // canRevise: bisa ubah berkas selama pendaftaran belum approved
  const canRevise = !isFullyApproved

  const docs = [
    {
      key: 'photo' as const,
      label: 'Pas Foto',
      accept: 'image/jpeg,image/jpg,image/png',
      hint: 'JPG/PNG, maks. 1 MB',
      path: siswa.photo,
      locked: isFullyApproved,
      lockedReason: 'Pendaftaran sudah diverifikasi',
    },
    {
      key: 'ktp' as const,
      label: 'KTP / Kartu Identitas',
      accept: 'image/jpeg,image/jpg,image/png',
      hint: 'JPG/PNG, maks. 1 MB',
      path: siswa.ktp,
      locked: isFullyApproved,
      lockedReason: 'Pendaftaran sudah diverifikasi',
    },
    {
      key: 'transfer' as const,
      label: 'Bukti Transfer',
      accept: 'image/jpeg,image/jpg,image/png',
      hint: 'JPG/PNG, maks. 1 MB',
      path: siswa.transfer,
      locked: isFullyApproved || isTransferApproved,
      lockedReason: isTransferApproved ? 'Pembayaran sudah diverifikasi' : 'Pendaftaran sudah diverifikasi',
    },
    {
      key: 'ijazah' as const,
      label: 'Ijazah',
      accept: 'image/jpeg,image/jpg,image/png,application/pdf',
      hint: 'JPG/PNG/PDF, maks. 2 MB',
      path: siswa.ijazah,
      locked: isFullyApproved,
      lockedReason: 'Pendaftaran sudah diverifikasi',
    },
  ]

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Dokumen Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola berkas pendaftaran Anda</p>
      </div>

      {/* Banner: fully approved — locked */}
      {isFullyApproved && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <Lock className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Pendaftaran Telah Disetujui</p>
            <p className="text-xs text-green-700 mt-0.5">Berkas tidak dapat diubah karena pendaftaran Anda sudah diverifikasi.</p>
          </div>
        </div>
      )}

      {/* Banner: transfer rejected — prompt to revise */}
      {!isFullyApproved && isTransferRejected && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Bukti Transfer Ditolak</p>
            {siswa.alasanTransfer && (
              <p className="text-xs text-red-700 mt-0.5">Alasan: {siswa.alasanTransfer}</p>
            )}
            <p className="text-xs text-red-600 mt-1">Silakan upload ulang bukti transfer yang benar di bawah ini.</p>
          </div>
        </div>
      )}

      {/* Banner: pendaftaran rejected */}
      {!isFullyApproved && siswa.statusPendaftaran === 'rejected' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Pendaftaran Ditolak</p>
            {siswa.alasanPendaftaran && (
              <p className="text-xs text-amber-700 mt-0.5">Alasan: {siswa.alasanPendaftaran}</p>
            )}
            <p className="text-xs text-amber-600 mt-1">Anda masih dapat memperbarui berkas jika diperlukan.</p>
          </div>
        </div>
      )}

      <RevisiDokumen docs={docs} canRevise={canRevise} />
    </div>
  )
}
