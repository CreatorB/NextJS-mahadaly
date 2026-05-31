import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kelola Program — SuperAdmin' }

export default async function ProgramPage() {
  const session = await getSession()
  if (!session || session.roleId !== 1) redirect('/admin/dashboard')

  const programs = await prisma.program.findMany({
    include: { _count: { select: { santri: true } } },
    orderBy: { id: 'asc' },
  })

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-brand-primary mb-6">Kelola Program</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Program</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status PSB</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Pendaftar</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.namaProgram}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.statusPsb === 'Buka' ? 'approved' : 'rejected'}>{p.statusPsb}</Badge>
                </td>
                <td className="px-4 py-3 font-bold text-brand-primary">{p._count.santri}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{p.keterangan ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
