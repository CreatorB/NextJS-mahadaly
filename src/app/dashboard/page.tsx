import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { FileText, Bell, CheckCircle, XCircle, Clock, Download, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard — Ma\'had Aly Syathiby' }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    pending: { label: 'Menunggu', class: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Diterima', class: 'bg-green-100 text-green-800' },
    rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-800' },
  }
  const s = map[status] ?? { label: status, class: 'bg-gray-100 text-gray-800' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.class}`}>{s.label}</span>
}

function StatusBadgeTransfer({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    pending: { label: 'Menunggu', class: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Diterima', class: 'bg-green-100 text-green-800' },
    rejected: { label: 'Ditolak', class: 'bg-red-100 text-red-800' },
  }
  const s = map[status] ?? { label: status, class: 'bg-gray-100 text-gray-800' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.class}`}>{s.label}</span>
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      siswa: {
        include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' }, take: 5 } },
      },
    },
  })

  if (!user?.siswa) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Data pendaftaran tidak ditemukan.</p>
      </div>
    )
  }

  const siswa = user.siswa
  const infoPsb = await prisma.infoPsb.findFirst({ where: { tahunAjaran: siswa.tahunPsb } })
  const linkGroup = siswa.statusTransfer === 'approved' ? infoPsb?.linkGroup ?? null : null

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Dashboard Peserta</h1>
        <p className="text-gray-500 text-sm">Selamat datang, <strong>{siswa.nama}</strong></p>
      </div>

      {/* Banner: transfer ditolak */}
      {siswa.statusTransfer === 'rejected' && siswa.statusPendaftaran !== 'approved' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Bukti Transfer Ditolak</p>
            {siswa.alasanTransfer && (
              <p className="text-xs text-red-700 mt-0.5">Alasan: {siswa.alasanTransfer}</p>
            )}
            <Link href="/dashboard/dokumen" className="inline-block mt-2 text-xs font-medium text-red-700 underline hover:text-red-900">
              Upload ulang bukti transfer →
            </Link>
          </div>
        </div>
      )}

      {/* Banner: pendaftaran ditolak */}
      {siswa.statusPendaftaran === 'rejected' && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Pendaftaran Ditolak</p>
            {siswa.alasanPendaftaran && (
              <p className="text-xs text-amber-700 mt-0.5">Alasan: {siswa.alasanPendaftaran}</p>
            )}
            <Link href="/dashboard/dokumen" className="inline-block mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900">
              Periksa dan perbarui berkas →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Status Pendaftaran
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendaftaran</span>
              <StatusBadge status={siswa.statusPendaftaran} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pembayaran</span>
              <StatusBadgeTransfer status={siswa.statusTransfer} />
            </div>
          </div>
        </Card>

        {linkGroup && (
          <Card className="p-5">
            <h2 className="font-semibold text-gray-700 mb-3">Link Grup WhatsApp</h2>
            <a
              href={linkGroup}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-brand-primary hover:underline"
            >
              <Download className="h-4 w-4" /> Gabung Grup
            </a>
          </Card>
        )}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notifikasi
        </h2>
        {siswa.notifications.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
        ) : (
          <div className="space-y-3">
            {siswa.notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="mt-0.5">
                  {n.type === 'approved' || n.type === 'info'
                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                    : n.type === 'rejected'
                    ? <XCircle className="h-4 w-4 text-red-600" />
                    : <Clock className="h-4 w-4 text-yellow-600" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Data Diri</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">NIK</p>
            <p className="font-medium">{siswa.nik}</p>
          </div>
          <div>
            <p className="text-gray-500">Tempat, Tgl Lahir</p>
            <p className="font-medium">{siswa.tmpLahir}, {new Date(siswa.tglLahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-gray-500">Jenis Kelamin</p>
            <p className="font-medium">{siswa.jk}</p>
          </div>
          <div>
            <p className="text-gray-500">Program</p>
            <p className="font-medium">{siswa.program?.namaProgram ?? '-'}</p>
          </div>
          <div>
            <p className="text-gray-500">No. HP</p>
            <p className="font-medium">{siswa.hp}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}