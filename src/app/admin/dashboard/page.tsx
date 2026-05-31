import prisma from '@/lib/prisma'
import { Card } from '@/components/ui/card'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin Dashboard — Ma\'had Aly Syathiby' }

export default async function AdminDashboard() {
  const [total, pending, approved, rejected, pendingTransfer] = await Promise.all([
    prisma.santri.count(),
    prisma.santri.count({ where: { statusPendaftaran: 'pending' } }),
    prisma.santri.count({ where: { statusPendaftaran: 'approved' } }),
    prisma.santri.count({ where: { statusPendaftaran: 'rejected' } }),
    prisma.santri.count({ where: { statusTransfer: 'pending' } }),
  ])

  const stats = [
    { label: 'Total Pendaftar', value: total, icon: Users, color: 'bg-brand-primary' },
    { label: 'Menunggu Verifikasi', value: pending, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Diterima', value: approved, icon: CheckCircle, color: 'bg-green-600' },
    { label: 'Ditolak', value: rejected, icon: XCircle, color: 'bg-red-500' },
  ]

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-primary">Dashboard Admin</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <div className={`${s.color} text-white rounded-xl p-3 w-fit mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {pendingTransfer > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            Terdapat <strong>{pendingTransfer}</strong> pembayaran menunggu verifikasi.{' '}
            <a href="/admin/pendaftaran?statusTransfer=pending" className="font-medium underline">Lihat sekarang</a>
          </p>
        </div>
      )}
    </div>
  )
}
