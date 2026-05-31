import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <DashboardSidebar nama={session.nama} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
