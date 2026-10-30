import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PsbStatusBanner } from '@/components/psb/PsbStatusBanner'
import { JadwalPsbSection } from '@/components/landing/JadwalPsbSection'
import { MateriSection } from '@/components/landing/MateriSection'
import { ProgramInfoCards } from '@/components/landing/ProgramInfoCards'
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  Phone,
  Info,
  ArrowRight,
  Compass,
  Link2,
} from 'lucide-react'
import prisma from '@/lib/prisma'
import { validateRegistrationLink } from '@/lib/registration-link'

type Props = {
  searchParams: Promise<{ id?: string }>
}

/**
 * Detail program Ma'had Aly (HKI) —（含 PSB: status, kuota, jadwal, panduan).
 * Dipakai oleh /program/hki. Form pendaftarannya tetap di /psb/daftar.
 */
export async function HkiProgramDetail({ searchParams }: Props) {
  const params = await searchParams
  let specialLink: Awaited<ReturnType<typeof validateRegistrationLink>> | null = null
  if (params.id) {
    specialLink = await validateRegistrationLink(params.id)
    if (!specialLink.ok) notFound()
  }
  const linkData = specialLink && specialLink.ok ? specialLink : null

  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })

  let quota: {
    tahunAjaran: string
    quotaIkhwan: number | null
    quotaAkhwat: number | null
    terdaftarIkhwan: number
    terdaftarAkhwat: number
    sisaIkhwan: number | null
    sisaAkhwat: number | null
  } | null = null

  if (info) {
    const [ikhwan, akhwat] = await Promise.all([
      prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Laki-Laki' } }),
      prisma.santri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Perempuan' } }),
    ])
    quota = {
      tahunAjaran: info.tahunAjaran,
      quotaIkhwan: info.quotaIkhwan,
      quotaAkhwat: info.quotaAkhwat,
      terdaftarIkhwan: ikhwan,
      terdaftarAkhwat: akhwat,
      sisaIkhwan: info.quotaIkhwan != null ? Math.max(0, info.quotaIkhwan - ikhwan) : null,
      sisaAkhwat: info.quotaAkhwat != null ? Math.max(0, info.quotaAkhwat - akhwat) : null,
    }
  }

  const infoForComponent = info
    ? {
        statusPsb: info.statusPsb,
        datetimeOpen: info.datetimeOpen?.toISOString() ?? null,
        datetimeClosed: info.datetimeClosed?.toISOString() ?? null,
        biayaPendaftaran: info.biayaPendaftaran,
        quotaIkhwan: info.quotaIkhwan,
        quotaAkhwat: info.quotaAkhwat,
        posterImages: info.posterImages ?? null,
      }
    : null

  const infoItems = [
    {
      icon: CalendarCheck,
      label: 'Pendaftaran Dibuka',
      value: info?.datetimeOpen
        ? new Date(info.datetimeOpen).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '-',
      tint: 'bg-brand-primary/10',
      color: 'text-brand-primary',
    },
    {
      icon: CalendarX,
      label: 'Pendaftaran Ditutup',
      value: info?.datetimeClosed
        ? new Date(info.datetimeClosed).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '-',
      tint: 'bg-brand-secondary/10',
      color: 'text-brand-secondary',
    },
    {
      icon: ClipboardCheck,
      label: 'Tes Masuk',
      value: 'Sabtu, 22 Agustus 2026',
      tint: 'bg-brand-light/15',
      color: 'text-brand-light',
    },
    {
      icon: Phone,
      label: 'Narahubung',
      value: '0811-1516-756',
      tint: 'bg-brand-secondary/10',
      color: 'text-brand-secondary',
      href: 'https://api.whatsapp.com/send?phone=628111516756',
    },
  ]

  return (
    <>
      {/* ===== HERO PROGRAM ===== */}
      <section className="relative overflow-hidden bg-[radial-gradient(130%_120%_at_50%_0%,#ffffff_0%,#fbfcfe_42%,#e9f1fb_100%)]">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #00367c 1px, transparent 1px), radial-gradient(circle at 75% 75%, #00367c 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-brand-light/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />

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
            Program 1 &middot; Hukum Keluarga Islam (HKI)
          </span>

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
            {quota?.tahunAjaran ? `Tahun Ajaran ${quota.tahunAjaran}` : 'Tahun Ajaran 2026/2027'}
          </div>

          <p className="mt-5 mx-auto max-w-2xl text-slate-600">
            Ma&apos;had Aly — S1 Ahwal Syakhsiyyah: belajar ilmu-ilmu syar&apos;i selama 4 tahun
            (8 semester) untuk Santri &amp; mahasiswa/i yang sudah bisa berbahasa Arab pasif, dengan
            ijazah S1.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/psb/daftar"
              className="bg-brand-primary text-white font-bold px-8 py-3.5 rounded-xl text-center hover:opacity-90 transition-opacity shadow-lg"
            >
              Daftar Program HKI
            </Link>
            <a
              href="#materi"
              className="border-2 border-brand-primary/25 text-brand-primary font-semibold px-8 py-3.5 rounded-xl text-center hover:bg-brand-primary/5 transition-colors"
            >
              Unduh Panduan &amp; Kalender
            </a>
          </div>
        </div>
      </section>

      {/* ===== MATERI PANDUAN (naik ke atas) ===== */}
      <MateriSection />

      {/* ===== INFORMASI PSB ===== */}
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-8">
        {linkData && (
          <div className="mb-6 rounded-2xl border-2 border-brand-accent/40 bg-gradient-to-br from-amber-50 to-white p-5 shadow-[0_12px_40px_-18px_rgba(0,54,124,0.35)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Link2 className="h-5 w-5 text-amber-700" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-amber-900">Pendaftaran Khusus</h2>
                  {linkData.remainingQuota !== null && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Sisa {linkData.remainingQuota}/{linkData.link.quota} kuota
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-amber-800">{linkData.link.label}</p>
                <p className="mt-1 text-xs text-amber-700/80">
                  Anda mengakses pendaftaran melalui tautan khusus. Kuota &amp; masa berlaku tautan ini
                  mengikuti kebijakan admin.
                </p>
                <Link
                  href={`/psb/daftar?ref=${linkData.link.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Daftar via Tautan Ini
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(0,54,124,0.35)] sm:p-7">
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
              <a
                key={label}
                href={href || '#'}
                target={href ? '_blank' : undefined}
                rel={href ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-brand-surface/60 px-4 py-3 transition-colors hover:border-brand-primary/20 hover:bg-brand-surface/80"
              >
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

        <div className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500">
          Sudah mendaftar?
          <Link
            href="/login"
            className="group inline-flex items-center gap-1 font-semibold text-brand-primary transition-colors hover:text-brand-secondary"
          >
            Login ke Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ===== INFORMASI PROGRAM (pindah dari hero landing page, 30 Okt 2026) ===== */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
            <Compass className="h-5 w-5 text-brand-primary" />
          </span>
          <div>
            <h2 className="font-bold leading-tight text-brand-primary">Informasi Program</h2>
            <p className="text-xs text-gray-400">Program belajar, jadwal, jumlah pendaftar &amp; kontak</p>
          </div>
        </div>
        <ProgramInfoCards />
      </section>

      <JadwalPsbSection showCta={false} />

      {/* ===== FORM PSB (section paling bawah) ===== */}
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        {infoForComponent ? (
          <PsbStatusBanner info={infoForComponent} quota={quota} />
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white py-10 text-center text-gray-500 shadow-sm">
            <p>
              Informasi PSB belum tersedia. Hubungi panitia di{' '}
              <a
                href="https://api.whatsapp.com/send?phone=628111516756"
                className="text-brand-secondary font-medium hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                0811-1516-756
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </>
  )
}
