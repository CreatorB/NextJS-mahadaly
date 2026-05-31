'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, FileText, LogOut, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Status Pendaftaran', icon: LayoutDashboard },
  { href: '/dashboard/dokumen', label: 'Dokumen', icon: FileText },
]

export function DashboardSidebar({ nama }: { nama: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-brand-primary text-white h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-white/20">
        <p className="font-bold text-brand-accent text-sm">Ma'had Aly Syathiby</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="bg-white/20 rounded-full p-2">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{nama}</p>
            <p className="text-xs text-blue-200">Peserta</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === item.href ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
          )}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-300 hover:bg-white/10 rounded-lg">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
