'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { ClipboardCheck, UserRound, LogOut } from 'lucide-react'

export function AbsenNav({ nama }: { nama: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const tabs = [
    { href: '/absen', label: 'Absen Hari Ini', icon: ClipboardCheck },
    { href: '/absen/profil', label: 'Profil Saya', icon: UserRound },
  ]

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch (e) {
      console.error('[logout] API call failed', e)
    }
    if (typeof window !== 'undefined') window.location.href = '/login'
    else router.push('/login')
  }

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 sm:top-20 lg:top-24 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Halo,</p>
            <p className="font-semibold text-brand-primary truncate">{nama}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = pathname === t.href
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-600 hover:bg-brand-surface',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
