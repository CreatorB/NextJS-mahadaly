'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, Users, Settings, LogOut, Shield, BookOpen, Menu, X, MapPin, Link2, Newspaper, BookOpenText, ListChecks, SlidersHorizontal, CalendarDays, KeyRound, UserRound } from 'lucide-react'
import { useState } from 'react'

interface Props {
  nama: string
  roleId: number
}

export function AdminSidebar({ nama, roleId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/pendaftaran', label: 'Pendaftaran', icon: Users },
    { href: '/admin/link-pendaftaran', label: 'Link Pendaftaran', icon: Link2 },
    { href: '/admin/pengaturan-psb', label: 'Pengaturan PSB', icon: Settings },
    { href: '/admin/profil', label: 'Profil', icon: UserRound },
    { href: '/admin/berita', label: 'Berita', icon: Newspaper },
    { href: '/admin/kias', label: 'KIAS — Ringkasan', icon: BookOpenText },
    { href: '/admin/kias/pendaftaran', label: 'KIAS — Pendaftar', icon: ListChecks },
    { href: '/admin/kias/pengaturan', label: 'KIAS — Pengaturan PSB', icon: SlidersHorizontal },
    { href: '/admin/events', label: 'Event', icon: CalendarDays },
    { href: '/admin/events/pengguna', label: 'Pengguna & Reset', icon: KeyRound },
    ...(roleId === 1 ? [
      { href: '/admin/wilayah', label: 'Wilayah', icon: MapPin },
      { href: '/admin/superadmin/users', label: 'Kelola User', icon: Shield },
      { href: '/admin/superadmin/program', label: 'Kelola Program', icon: BookOpen },
    ] : []),
  ]

  // Menu yang hanya aktif saat path-nya persis sama (mis. /admin/events vs /admin/events/pengguna)
  const exactHrefs = ['/admin/kias', '/admin/events', '/admin/events/pengguna']
  const isActive = (href: string) => (exactHrefs.includes(href) ? pathname === href : pathname.startsWith(href))

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch (e) {
      console.error('[logout] API call failed', e)
    }
    // Pakai window.location.href untuk full-page navigation yang lebih reliable
    // (router.push di Next.js 16 kadang gagal di edge cases setelah async operation)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    } else {
      router.push('/login')
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-primary text-white rounded-lg shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      <aside className={clsx(
        'w-64 bg-brand-primary text-white min-h-screen flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/20">
          <div>
            <a
              href="https://mahadaly.syathiby.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-accent hover:text-white transition-colors"
            >
              Ma&apos;had Aly Syathiby
            </a>
            <p className="text-blue-200 text-sm mt-1">Panel {roleId === 1 ? 'Super Admin' : 'Admin'}</p>
            <p className="text-white text-xs mt-2 font-medium">{nama}</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 hover:bg-white/10 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={closeSidebar} className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(item.href) ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
            )}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-white/20 mt-2">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  )
}
