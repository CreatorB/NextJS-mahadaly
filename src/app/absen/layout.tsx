import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AbsenNav } from './AbsenNav'

export const dynamic = 'force-dynamic'

export default async function AbsenLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login?next=/absen')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { nama: true, role: { select: { namaRole: true } } },
  })
  if (!user) redirect('/login?next=/absen')

  // Pegawai (staf) boleh masuk area ini; admin juga boleh untuk pratinjau.
  const boleh = user.role.namaRole === 'pegawai' || session.roleId <= 2
  if (!boleh) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <Navbar />
      <AbsenNav nama={user.nama} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
