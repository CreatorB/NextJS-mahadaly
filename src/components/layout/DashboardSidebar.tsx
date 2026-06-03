'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, FileText, LogOut, User, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Status Pendaftaran', icon: LayoutDashboard },
  { href: '/dashboard/dokumen', label: 'Dokumen', icon: FileText },
]

function NavLinks({ pathname, onNavigate, onLogout }: { pathname: string; onNavigate?: () => void; onLogout: () => void }) {
  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === item.href ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
      <div className="pt-2 border-t border-white/20 mt-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-300 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </nav>
  )
}

export function DashboardSidebar({ nama }: { nama: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {/* ── Mobile: fixed top bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-brand-primary text-white flex items-center justify-between px-4 h-14 shadow-md">
        <p className="font-bold text-brand-accent text-sm">Ma&apos;had Aly Syathiby</p>
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Mobile: drawer overlay ──────────────────────────────── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <aside className="w-72 bg-brand-primary text-white flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
              <p className="font-bold text-brand-accent text-sm">Ma&apos;had Aly Syathiby</p>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 border-b border-white/20 flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{nama}</p>
                <p className="text-xs text-blue-200">Peserta</p>
              </div>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setIsOpen(false)} onLogout={logout} />
          </aside>
          {/* Backdrop */}
          <div className="flex-1 bg-black/50" onClick={() => setIsOpen(false)} />
        </div>
      )}

      {/* ── Desktop: sticky sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-brand-primary text-white h-screen sticky top-0 flex-col">
        <div className="p-6 border-b border-white/20">
          <p className="font-bold text-brand-accent text-sm">Ma&apos;had Aly Syathiby</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="bg-white/20 rounded-full p-2 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{nama}</p>
              <p className="text-xs text-blue-200">Peserta</p>
            </div>
          </div>
        </div>
        <NavLinks pathname={pathname} onLogout={logout} />
      </aside>
    </>
  )
}
