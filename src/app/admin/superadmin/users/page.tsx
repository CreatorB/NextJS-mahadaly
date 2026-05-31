import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kelola User — SuperAdmin' }

export default async function UsersPage() {
  const session = await getSession()
  if (!session || session.roleId !== 1) redirect('/admin/dashboard')

  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-brand-primary mb-6">Kelola User</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Terdaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.nama}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.roleId === 1 ? 'info' : u.roleId === 2 ? 'approved' : 'default'}>
                    {u.role.namaRole}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? 'approved' : 'rejected'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{format(u.createdAt, 'dd/MM/yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
