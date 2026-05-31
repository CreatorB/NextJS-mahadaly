import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.roleId > 2) redirect('/login')

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <AdminSidebar nama={session.nama} roleId={session.roleId} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
