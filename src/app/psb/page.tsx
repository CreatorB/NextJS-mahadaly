import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PsbStatusBanner } from '@/components/psb/PsbStatusBanner'
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  Wallet,
  Phone,
  Info,
  ArrowRight,
} from 'lucide-react'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "PSB 2026 — Ma'had Aly Al-Imam Asy-Syathiby",
  description: 'Penerimaan Santri/Mahasiswa Baru Tahun Ajaran 2026/2027',
}

async function getPsbData() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  if (!info) return { info: null, quota: null }

  const [ikhwan, akhwat] = await Promise.all([
    prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Laki-Laki' } }),
    prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Perempuan' } }),
  ])

  const quota = {
    tahunAjaran: info.tahunAjaran,
    quotaIkhwan: info.quotaIkhwan,
    quotaAkhwat: info.quotaAkhwat,
    terdaftarIkhwan: ikhwan,
    terdaftarAkhwat: akhwat,
    sisaIkhwan: info.quotaIkhwan != null ? Math.max(0, info.quotaIkhwan - ikhwan) : null,
    sisaAkhwat: info.quotaAkhwat != null ? Math.max(0, info.quotaAkhwat - akhwat) : null,
  }

  const infoForComponent = {
    statusPsb: info.statusPsb,
    datetimeOpen: info.datetimeOpen?.toISOString() ?? null,
    datetimeClosed: info.datetimeClosed?.toISOString() ?? null,
    biayaPendaftaran: info.biayaPendaftaran,
    quotaIkhwan: info.quotaIkhwan,
    quotaAkhwat: info.quotaAkhwat,
  }

  return { info: infoForComponent, quota }
}

export default async function PsbPage() {
  const { info, quota } = await getPsbData()

  const infoItems = [
    { icon: CalendarCheck, label: 'Pendaftaran Dibuka', value: '25 Mei 2026', tint: 'bg-brand-primary/10', color: 'text-brand-primary' },
    { icon: CalendarX, label: 'Pendaftaran Ditutup', value: '19 Agustus 2026', tint: 'bg-brand-secondary/10', color: 'text-brand-secondary' },
    { icon: ClipboardCheck, label: 'Tes Masuk', value: 'Sabtu, 22 Agustus 2026', tint: 'bg-brand-light/15', color: 'text-brand-light' },
    { icon: Wallet, label: 'Biaya Pendaftaran', value: 'Rp 150.000', tint: 'bg-brand-primary/10', color: 'text-brand-primary' },
    { icon: Phone, label: 'Narahubung', value: '0811-1516-756', tint: 'bg-brand-secondary/10', color: 'text-brand-secondary', href: 'https://api.whatsapp.com/send?phone=628111516756' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface">
        {/* ===== HERO ===== */}
        <div className="relative overflow-hidden bg-[radial-gradient(130%_120%_at_50%_0%,#ffffff_0%,#fbfcfe_42%,#e9f1fb_100%)]">
          {/* dotted texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #00367c 1px, transparent 1px), radial-gradient(circle at 75% 75%, #00367c 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
          {/* soft color glows */}
          <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-brand-light/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
          {/* thin ring ornaments */}
          <div className="absolute top-8 right-10 h-28 w-28 rounded-full border border-brand-primary/10" />
          <div className="absolute top-14 right-16 h-16 w-16 rounded-full border border-brand-secondary/10" />
          <div className="absolute bottom-12 left-12 h-20 w-20 rounded-full border border-brand-secondary/10" />

          <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-16 text-center">
            <Image
              src="/images/mahadalysyathiby-logo-landscape-name-color-trim.png"
              alt="Logo Ma'had Aly"
              width={4361}
              height={1496}
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 380px, 460px"
              className="mx-auto mb-7 h-24 w-auto object-contain sm:h-32 lg:h-40"
              priority
            />

            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-secondary shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
              Penerimaan Mahasiswa/Mahasiswi Baru
            </span>

            {/* diamond divider */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-primary/40" />
              <span className="h-2 w-2 rotate-45 bg-brand-accent ring-1 ring-brand-primary/25" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-primary/40" />
            </div>

            <p className="mt-4 text-lg font-semibold text-brand-secondary sm:text-xl">
              Ma&apos;had Aly Al-Imam Asy-Syathiby
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-primary/20">
              <CalendarDays className="h-4 w-4 text-brand-accent" />
              Tahun Ajaran 2026 / 2027
            </div>
          </div>

          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 54C120 48 240 36 360 30C480 24 600 24 720 27C840 30 960 36 1080 39C1200 42 1320 42 1380 42L1440 42V60H0Z" fill="#f9f9f9" />
          </svg>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-8">
          {info ? (
            <PsbStatusBanner info={info} quota={quota} />
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-500 shadow-sm">
              <p>Informasi PSB belum tersedia. Hubungi panitia di <a href="https://api.whatsapp.com/send?phone=628111516756" className="text-brand-secondary font-medium hover:underline" target="_blank" rel="noopener noreferrer">0811-1516-756</a>.</p>
            </div>
          )}

          {/* Informasi Penting */}
          <div className="mt-8 rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(0,54,124,0.35)] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                <Info className="h-5 w-5 text-brand-primary" />
              </span>
              <div>
                <h3 className="font-bold leading-tight text-brand-primary">Informasi Penting</h3>
                <p className="text-xs text-gray-400">Jadwal &amp; ketentuan pendaftaran</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {infoItems.map(({ icon: Icon, label, value, tint, color, href }) => (
                <a key={label} href={href || '#'} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3 transition-colors hover:border-brand-primary/20 hover:bg-brand-surface/80">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
                    <div className="text-sm font-semibold leading-tight text-gray-800">{value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Login */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500">
            Sudah mendaftar?
            <Link href="/login" className="group inline-flex items-center gap-1 font-semibold text-brand-primary transition-colors hover:text-brand-secondary">
              Login ke Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
