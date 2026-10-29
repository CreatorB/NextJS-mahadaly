import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProgramCatalogList } from './ProgramCatalogList'
import { ArrowRight, Link2, CalendarDays } from 'lucide-react'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { validateRegistrationLink } from '@/lib/registration-link'
import { getCatalogRekap } from '@/lib/program-catalog'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ id?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  const tahun = info?.tahunAjaran ?? '2026'
  const title = params.id
    ? 'Pendaftaran Khusus — Ma\'had Aly Asy-Syathiby'
    : `Penerimaan Santri & Mahasiswa Baru ${tahun}/${Number(tahun) + 1}`

  return {
    title,
    description: `Pilih program pendaftaran di Ma'had Aly Al-Imam Asy-Syathiby: Program 1 Hukum Keluarga Islam (HKI) S1, Program 2 KIAS (Kursus Ilmu Bahasa Arab & Syar'i).`,
    alternates: { canonical: '/psb' },
    openGraph: {
      title,
      description:
        "Pilih program pendaftaran di Ma'had Aly Al-Imam Asy-Syathiby: Hukum Keluarga Islam (HKI) S1 dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i).",
      url: '/psb',
      type: 'website',
      locale: 'id_ID',
      images: [
        {
          url: '/images/mahadalysyathiby-logo-landscape-name-color-trim.png',
          width: 4361,
          height: 1496,
          alt: "Ma'had Aly Al-Imam Asy-Syathiby",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description:
        "Pilih program pendaftaran di Ma'had Aly Al-Imam Asy-Syathiby: HKI S1 dan KIAS.",
      images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
    },
  }
}

/**
 * HUB pendaftaran — satu-satunya pintu masuk PSB.
 *
 * Daftar program diambil dari tabel `program_katalog` (bukan hardcode), jadi
 * program baru cukup ditambah satu baris di database.
 *
 * `?id=<slug>` tetap ditangani di sini supaya link pendaftaran khusus yang
 * sudah dibagikan (format lama `/psb?id=...`) tidak mati.
 */
export default async function PsbHubPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const rekap = await getCatalogRekap()

  let specialLink: Awaited<ReturnType<typeof validateRegistrationLink>> | null = null
  if (params.id) {
    specialLink = await validateRegistrationLink(params.id)
    if (!specialLink.ok) notFound()
  }
  const linkData = specialLink && specialLink.ok ? specialLink : null

  const tahun = rekap.programs.find((p) => p.tahunAjaran)?.tahunAjaran ?? '2026'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-surface">
        {/* ===== HERO ===== */}
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

          <div className="relative mx-auto max-w-3xl px-4 pt-14 pb-14 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-secondary shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
              Penerimaan Santri &amp; Mahasiswa/Mahasiswi Baru
            </span>

            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand-primary/40" />
              <span className="h-2 w-2 rotate-45 bg-brand-accent ring-1 ring-brand-primary/25" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand-primary/40" />
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-brand-primary leading-tight">
              Ma&apos;had Aly Al-Imam Asy-Syathiby
            </h1>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white shadow-md shadow-brand-primary/20">
              <CalendarDays className="h-4 w-4 text-brand-accent" /> Tahun Ajaran {tahun}
            </div>

            <p className="mt-5 mx-auto max-w-2xl text-slate-600">
              Pilih program yang sesuai dengan kebutuhan belajar Anda. Setiap program punya kurikulum,
              jadwal, dan biaya sendiri.
            </p>
          </div>
        </section>

        {/* ===== DAFTAR PROGRAM ===== */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-5xl">
            {linkData && (
              <div className="mb-8 rounded-2xl border-2 border-brand-accent/40 bg-gradient-to-br from-amber-50 to-white p-5 shadow-[0_12px_40px_-18px_rgba(0,54,124,0.35)]">
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

            <ProgramCatalogList
              programs={rekap.programs}
              filters={rekap.filters}
              totalPendaftar={rekap.totalPendaftar}
              totalTahunIni={rekap.totalTahunIni}
            />

            <div className="mt-12 flex flex-col items-center justify-center gap-1.5 text-sm text-gray-500">
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
        </section>
      </main>
      <Footer />
    </>
  )
}
