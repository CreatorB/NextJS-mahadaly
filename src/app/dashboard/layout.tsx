import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { siswaId: true, kiasSantriId: true } })
  const program = user?.siswaId && user.kiasSantriId ? 'both' : user?.kiasSantriId ? 'kias' : user?.siswaId ? 'hki' : 'peserta'

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <DashboardSidebar nama={session.nama} program={program} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
