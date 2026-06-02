'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/#program', label: 'Program' },
    { href: '/#pengajar', label: 'Pengajar' },
    { href: '/#kurikulum', label: 'Kurikulum' },
    { href: '/#jadwal', label: 'Jadwal PMB' },
    { href: '/#kontak', label: 'Kontak' },
  ]

return (
    <nav className="bg-brand-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 lg:h-24 flex items-center">
        <Link href="/" className="shrink-0 flex h-full py-1.5 leading-[0]">
          <Image
            src="/images/mahadalysyathiby-logo-landscape-name-white-trim.png"
            alt="Ma'had Aly Al-Imam Asy-Syathiby"
            width={4361}
            height={1496}
            className="h-full w-auto object-contain block"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-6 ml-auto">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm hover:text-brand-accent transition-colors">
              {l.label}
            </a>
          ))}
          <Link href="/psb" className="bg-brand-accent text-brand-primary font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
            Daftar PSB
          </Link>
        </div>

        <button className="md:hidden p-2 ml-auto">
          <Menu className="h-5 w-5" onClick={() => setOpen(!open)} />
        </button>
      </div>

      {open && (
        <div className="md:hidden pb-4 px-4 sm:px-6 lg:px-8 flex flex-col gap-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm py-1 hover:text-brand-accent" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link href="/psb" className="bg-brand-accent text-brand-primary font-semibold px-4 py-2 rounded-lg text-sm text-center">
            Daftar PSB
          </Link>
        </div>
      )}
    </nav>
  )
}
