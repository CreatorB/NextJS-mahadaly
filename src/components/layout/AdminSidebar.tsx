'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, Users, Settings, LogOut, Shield, BookOpen } from 'lucide-react'

interface Props {
  nama: string
  roleId: number
}

export function AdminSidebar({ nama, roleId }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/pendaftaran', label: 'Pendaftaran', icon: Users },
    { href: '/admin/pengaturan-psb', label: 'Pengaturan PSB', icon: Settings },
    ...(roleId === 1 ? [
      { href: '/admin/superadmin/users', label: 'Kelola User', icon: Shield },
      { href: '/admin/superadmin/program', label: 'Kelola Program', icon: BookOpen },
    ] : []),
  ]

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-brand-primary text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/20">
        <p className="font-bold text-brand-accent">Ma'had Aly Syathiby</p>
        <p className="text-blue-200 text-sm mt-1">Panel {roleId === 1 ? 'Super Admin' : 'Admin'}</p>
        <p className="text-white text-xs mt-2 font-medium">{nama}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname.startsWith(item.href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
          )}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/20">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-300 hover:bg-white/10 rounded-lg">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
