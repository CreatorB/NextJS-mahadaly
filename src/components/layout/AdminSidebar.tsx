'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Settings, LogOut, Shield, BookOpen, Menu, X, MapPin, Link2,
  Newspaper, BookOpenText, ListChecks, SlidersHorizontal, CalendarDays, KeyRound, UserRound,
  ClipboardCheck, Briefcase, FileText, Type, HardDrive, ChevronDown, Search, UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  nama: string
  roleId: number
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Hanya aktif kalau path persis sama (mis. /admin/events vs /admin/events/pengguna). */
  exact?: boolean
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

/**
 * Sidebar admin.
 *
 * Struktur: menu utama (Dashboard + grup) dengan sub-menu yang bisa
 * dibuka-tutup, pencarian menu, dan daftar menu yang bisa di-scroll.
 */
export function AdminSidebar({ nama, roleId }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cari, setCari] = useState('')
  /** Status buka/tutup per grup; `undefined` = pakai default (grup aktif terbuka). */
  const [terbuka, setTerbuka] = useState<Record<string, boolean>>({})

  const cariRef = useRef<HTMLInputElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const aktifRef = useRef<HTMLAnchorElement>(null)

  const groups = useMemo<NavGroup[]>(
    () => [
      {
        id: 'pendaftaran',
        label: 'Pendaftaran & PSB',
        icon: UsersRound,
        items: [
          { href: '/admin/pendaftaran', label: 'Pendaftaran', icon: Users },
          { href: '/admin/link-pendaftaran', label: 'Link Pendaftaran', icon: Link2 },
          { href: '/admin/pengaturan-psb', label: 'Pengaturan PSB', icon: Settings },
          { href: '/admin/kias/pendaftaran', label: 'Pendaftar KIAS', icon: ListChecks },
          { href: '/admin/kias/pengaturan', label: 'Pengaturan PSB KIAS', icon: SlidersHorizontal },
        ],
      },
      {
        id: 'konten',
        label: 'Konten & Website',
        icon: Type,
        items: [
          { href: '/admin/profil', label: 'Profil', icon: UserRound },
          { href: '/admin/info', label: 'Info & Panduan', icon: FileText },
          { href: '/admin/konten', label: 'Konten Website', icon: Type },
          { href: '/admin/berita', label: 'Berita', icon: Newspaper },
          { href: '/admin/berkas', label: 'Manajemen Berkas', icon: HardDrive },
        ],
      },
      {
        id: 'program',
        label: 'Program & Event',
        icon: CalendarDays,
        items: [
          { href: '/admin/kias', label: 'Ringkasan KIAS', icon: BookOpenText, exact: true },
          { href: '/admin/events', label: 'Event', icon: CalendarDays, exact: true },
          { href: '/admin/events/pengguna', label: 'Pengguna Event & Reset', icon: KeyRound, exact: true },
        ],
      },
      {
        id: 'absensi',
        label: 'Absensi & Pegawai',
        icon: ClipboardCheck,
        items: [
          { href: '/admin/absen', label: 'Absen Kerja', icon: ClipboardCheck },
          { href: '/admin/pegawai', label: 'Pegawai', icon: Briefcase },
          { href: '/admin/pengaturan-absensi', label: 'Pengaturan Absen', icon: SlidersHorizontal },
        ],
      },
      ...(roleId === 1
        ? [
            {
              id: 'sistem',
              label: 'Sistem & Master',
              icon: Shield,
              items: [
                { href: '/admin/wilayah', label: 'Wilayah', icon: MapPin },
                { href: '/admin/superadmin/users', label: 'Kelola User', icon: Shield },
                { href: '/admin/superadmin/program', label: 'Kelola Program', icon: BookOpen },
              ],
            } satisfies NavGroup,
          ]
        : []),
    ],
    [roleId],
  )

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  /** Grup yang memuat menu aktif — default-nya grup ini terbuka. */
  const grupAktif = groups.find((g) => g.items.some((i) => isActive(i)))?.id

  const grupTerbuka = (id: string) =>
    cari.trim().length > 0 || (terbuka[id] !== undefined ? terbuka[id] : id === grupAktif)

  const toggleGrup = (id: string) => {
    const sekarang = grupTerbuka(id)
    setTerbuka((t) => ({ ...t, [id]: !sekarang }))
  }

  // Pencarian: cocokkan label menu (kalau label grup cocok, semua sub-menu-nya ditampilkan).
  const q = cari.trim().toLowerCase()
  const cocokTeks = (s: string) => s.toLowerCase().includes(q)

  const hasilGrup = useMemo(
    () =>
      groups
        .map((g) => {
          if (!q) return { ...g, tampil: g.items }
          const grupCocok = cocokTeks(g.label)
          return {
            ...g,
            tampil: grupCocok ? g.items : g.items.filter((i) => cocokTeks(i.label) || cocokTeks(i.href)),
          }
        })
        .filter((g) => (q ? g.tampil.length > 0 : true)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, q],
  )

  const dashboardTampil = !q || cocokTeks('Dashboard') || cocokTeks('/admin/dashboard')
  const totalCocok = hasilGrup.reduce((n, g) => n + g.tampil.length, 0)

  // Menu aktif otomatis digulir ke tampilan saat halaman berubah.
  useEffect(() => {
    aktifRef.current?.scrollIntoView({ block: 'nearest' })
  }, [pathname, q])

  // Pintasan "/" untuk fokus pencarian, "Esc" untuk menutup/clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const mengetik = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (e.key === '/' && !mengetik) {
        e.preventDefault()
        cariRef.current?.focus()
      }
      if (e.key === 'Escape') {
        if (document.activeElement === cariRef.current) {
          setCari('')
          cariRef.current?.blur()
        } else if (sidebarOpen) {
          setSidebarOpen(false)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

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
        aria-label="Buka menu"
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
        'w-72 shrink-0 bg-brand-primary text-white h-screen flex flex-col fixed lg:sticky lg:top-0 lg:bottom-auto inset-y-0 left-0 z-50 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Kepala: brand + pengguna */}
        <div className="shrink-0 flex items-center justify-between p-4 lg:p-5 border-b border-white/20">
          <div className="min-w-0">
            <a
              href="https://mahadaly.syathiby.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-accent hover:text-white transition-colors"
            >
              Ma&apos;had Aly Syathiby
            </a>
            <p className="text-blue-200 text-sm mt-1">Panel {roleId === 1 ? 'Super Admin' : 'Admin'}</p>
            <p className="text-white text-xs mt-1 font-medium truncate">{nama}</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 hover:bg-white/10 rounded" aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pencarian menu */}
        <div className="shrink-0 px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
            <input
              ref={cariRef}
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari menu… (tekan /)"
              aria-label="Cari menu"
              className="w-full rounded-lg border border-white/20 bg-white/10 py-2 pl-9 pr-8 text-sm text-white placeholder-blue-200/80 outline-none focus:border-brand-accent focus:bg-white/15"
            />
            {cari && (
              <button
                type="button"
                onClick={() => {
                  setCari('')
                  cariRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-blue-200 hover:text-white"
                aria-label="Bersihkan pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {q && (
            <p className="mt-2 text-[11px] text-blue-200">
              {totalCocok} menu cocok untuk &ldquo;{cari.trim()}&rdquo;
            </p>
          )}
        </div>

        {/* Daftar menu (area scroll) */}
        <nav
          ref={navRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3 space-y-1
                     [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full
                     [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {dashboardTampil && (
            <Link
              href="/admin/dashboard"
              onClick={closeSidebar}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                pathname === '/admin/dashboard' ? 'bg-white/20' : 'hover:bg-white/10',
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Dashboard
            </Link>
          )}

          {hasilGrup.map((g) => {
            const terbuka = grupTerbuka(g.id)
            return (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGrup(g.id)}
                  aria-expanded={terbuka}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                >
                  <g.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{g.label}</span>
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] tabular-nums">
                    {g.tampil.length}
                  </span>
                  <ChevronDown className={clsx('h-4 w-4 shrink-0 transition-transform', terbuka && 'rotate-180')} />
                </button>

                {/* Sub-menu */}
                <div
                  className={clsx(
                    'grid transition-[grid-template-rows] duration-200',
                    terbuka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-1 ml-4 space-y-0.5 border-l border-white/15 pl-2">
                      {g.tampil.map((item) => {
                        const aktif = isActive(item)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeSidebar}
                            ref={aktif ? aktifRef : undefined}
                            className={clsx(
                              'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                              aktif
                                ? 'bg-white/20 font-semibold text-white shadow-inner'
                                : 'text-blue-100 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            <item.icon className={clsx('h-3.5 w-3.5 shrink-0', aktif ? 'text-brand-accent' : 'text-blue-300')} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {q && totalCocok === 0 && !dashboardTampil && (
            <p className="px-3 py-6 text-center text-sm text-blue-200">
              Menu &ldquo;{cari.trim()}&rdquo; tidak ditemukan.
            </p>
          )}
        </nav>

        {/* Logout (tetap terlihat, tidak ikut scroll) */}
        <div className="shrink-0 border-t border-white/20 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-300 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
