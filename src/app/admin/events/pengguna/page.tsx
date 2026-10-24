import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { listManagedUsers, toManagedUserDTO } from '@/lib/event-users'
import { EventUsersClient } from './EventUsersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pengguna & Reset Password — Admin' }

export default async function AdminEventUsersPage() {
  const rows = await listManagedUsers()
  const pending = rows.filter((r) => r.adaRequest).length

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Event
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-brand-primary">Pengguna & Reset Password</h1>
          <p className="text-sm text-gray-500">
            Kelola akun peserta event, Santri PSB, dan Santri KIAS. Reset password bisa dibuat langsung (password
            sementara) atau lewat link yang dikirim ke pengguna via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <KeyRound className="h-5 w-5 text-brand-primary" />
          <div className="text-sm">
            <div className="font-semibold text-gray-800">{rows.length} akun</div>
            <div className="text-xs text-gray-500">{pending} permintaan reset menunggu</div>
          </div>
        </div>
      </div>

      <EventUsersClient initialRows={rows.map(toManagedUserDTO)} />
    </div>
  )
}
