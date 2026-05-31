import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Badge, statusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Clock, ExternalLink, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard — Ma\'had Aly Syathiby' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      santri: {
        include: { program: true, pekerjaan: true, notifications: { orderBy: { createdAt: 'desc' }, take: 5 } },
      },
    },
  })

  if (!user?.santri) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Data pendaftaran tidak ditemukan.</p>
      </div>
    )
  }

  const santri = user.santri
  const infoPsb = await prisma.infoPsb.findFirst({ where: { tahunAjaran: santri.tahunPsb } })
  const linkGroup = santri.statusTransfer === 'approved' ? infoPsb?.linkGroup ?? null : null

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Dashboard Peserta</h1>
        <p className="text-gray-500 text-sm">Selamat datang, <strong>{santri.nama}</strong></p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Status Pendaftaran</p>
            {statusBadge(santri.statusPendaftaran)}
          </div>
          {santri.statusPendaftaran === 'rejected' && santri.alasanPendaftaran && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{santri.alasanPendaftaran}</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Status Pembayaran</p>
            <Badge variant={santri.statusTransfer === 'approved' ? 'approved' : santri.statusTransfer === 'rejected' ? 'rejected' : 'pending'}>
              {santri.statusTransfer === 'approved' ? 'Terverifikasi' : santri.statusTransfer === 'rejected' ? 'Ditolak' : 'Menunggu'}
            </Badge>
          </div>
          {santri.statusTransfer === 'rejected' && santri.alasanTransfer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{santri.alasanTransfer}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Link Group */}
      {linkGroup && (
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Bergabung ke Grup WhatsApp</p>
              <p className="text-sm text-green-700">Pembayaran Anda telah dikonfirmasi. Klik untuk bergabung ke grup kelas.</p>
            </div>
            <a href={linkGroup} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-green-700">
              Gabung <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card>
        <h3 className="font-semibold text-brand-primary mb-4">Data Pendaftaran</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Kode Registrasi', value: santri.kodeRegistrasi },
            { label: 'Program', value: santri.program.namaProgram },
            { label: 'Tahun Ajaran', value: santri.tahunPsb },
            { label: 'Tanggal Daftar', value: format(santri.createdAt, 'dd MMM yyyy', { locale: id }) },
            { label: 'Nominal Transfer', value: santri.nominalTransfer ? `Rp ${Number(santri.nominalTransfer).toLocaleString('id-ID')}` : '-' },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-gray-500 text-xs">{item.label}</p>
              <p className="font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      {santri.notifications.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-brand-primary" />
            <h3 className="font-semibold text-brand-primary">Notifikasi</h3>
          </div>
          <div className="space-y-3">
            {santri.notifications.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg border ${n.type === 'approved' ? 'bg-green-50 border-green-200' : n.type === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{format(n.createdAt, 'dd MMM yyyy, HH:mm', { locale: id })}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
