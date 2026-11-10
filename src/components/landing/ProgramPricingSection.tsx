import Link from 'next/link'
import { Check, GraduationCap, BookOpenText, ArrowRight, type LucideIcon } from 'lucide-react'
import prisma from '@/lib/prisma'
import { formatRupiah, formatRupiahShort, getActiveKiasInfo, getKiasJenisPrograms, isKiasPsbOpen } from '@/lib/kias'
import { getKontenItems, getKontenMap, getKontenTag } from '@/lib/konten'
import { applyTag } from '@/lib/konten-shared'

interface PlanCardProps {
  featured?: boolean
  icon: LucideIcon
  badge: string
  code: string
  name: string
  tagline: string
  priceLabel: string
  price: string
  priceUnit: string
  priceNote: string
  status: 'Buka' | 'Tutup'
  features: string[]
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
}

function PlanCard(p: PlanCardProps) {
  const Icon = p.icon
  const dark = p.featured
  return (
    <div
      className={`relative flex flex-col rounded-3xl p-8 shadow-xl transition-transform hover:-translate-y-1 ${
        dark
          ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white ring-4 ring-brand-accent/60'
          : 'bg-white text-slate-900 border border-slate-200'
      }`}
    >
      <div
        className={`absolute -top-4 left-8 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide shadow ${
          dark ? 'bg-brand-accent text-brand-primary' : 'bg-brand-primary text-white'
        }`}
      >
        {p.badge}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 mt-2">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              dark ? 'bg-white/15 text-brand-accent' : 'bg-brand-primary/10 text-brand-primary'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className={`text-xs font-semibold tracking-widest ${dark ? 'text-brand-accent' : 'text-brand-secondary'}`}>
              {p.code}
            </p>
            <h3 className="text-xl font-bold leading-tight">{p.name}</h3>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            p.status === 'Buka'
              ? dark
                ? 'bg-emerald-400/20 text-emerald-200'
                : 'bg-emerald-100 text-emerald-700'
              : dark
                ? 'bg-white/10 text-blue-100'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {p.status === 'Buka' ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
        </span>
      </div>

      <p className={`text-sm mb-6 ${dark ? 'text-blue-100' : 'text-slate-600'}`}>{p.tagline}</p>

      <div className={`rounded-2xl p-5 mb-6 ${dark ? 'bg-white/10' : 'bg-brand-surface'}`}>
        <p className={`text-xs font-medium mb-1 ${dark ? 'text-blue-200' : 'text-slate-500'}`}>
          {p.priceLabel}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-sm font-semibold">Rp</span>
          <span className="text-5xl font-extrabold tracking-tight">{p.price}</span>
          <span className={`text-sm ${dark ? 'text-blue-200' : 'text-slate-500'}`}>/{p.priceUnit}</span>
        </p>
        <p className={`text-xs mt-2 ${dark ? 'text-blue-200' : 'text-slate-500'}`}>{p.priceNote}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <Check className={`h-5 w-5 shrink-0 ${dark ? 'text-brand-accent' : 'text-emerald-600'}`} />
            <span className={dark ? 'text-blue-50' : 'text-slate-700'}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <Link
          href={p.primary.href}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold transition-opacity hover:opacity-90 ${
            dark ? 'bg-brand-accent text-brand-primary' : 'bg-brand-primary text-white'
          }`}
        >
          {p.primary.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={p.secondary.href}
          className={`text-center text-sm font-semibold py-2 ${dark ? 'text-white/90 hover:text-white' : 'text-brand-primary hover:underline'}`}
        >
          {p.secondary.label}
        </Link>
      </div>
    </div>
  )
}

/**
 * Section "Program Belajar" (dua kartu program) di beranda.
 *
 * Label & tombol disunting dari panel admin (tabel `konten`), daftar fitur
 * dari `konten_item` (grup `fitur-hki` / `fitur-kias`). Nominal & status
 * pendaftaran tetap dari data PSB.
 */
export async function ProgramPricingSection() {
  const [hki, kias, jenis, konten, tag, fiturHki, fiturKias] = await Promise.all([
    prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } }),
    getActiveKiasInfo(),
    getKiasJenisPrograms(),
    getKontenMap(),
    getKontenTag(),
    getKontenItems('fitur-hki', { hanyaTampil: true }),
    getKontenItems('fitur-kias', { hanyaTampil: true }),
  ])

  const hkiSemester = hki?.biayaKuliahSemester ?? 3000000
  const hkiCicilan = hki?.biayaCicilanBulanan ?? 500000
  const hkiStatus = hki?.statusPsb === 'Buka' ? 'Buka' : hki ? 'Tutup' : 'Buka'

  const kiasSpp = kias?.biayaSppBulanan ?? 250000
  const kiasStatus = isKiasPsbOpen(kias) ? 'Buka' : 'Tutup'
  const kelasBuka = jenis.flatMap((j) => j.programs).filter((p) => p.statusPsb === 'Buka').length

  return (
    <section id="pilih-program" className="scroll-mt-24 py-20 px-4 bg-gradient-to-b from-brand-surface to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest text-brand-secondary uppercase mb-2">
            {konten['pricing.label']}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-brand-primary mb-3">
            {konten['pricing.judul']}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">{konten['pricing.deskripsi']}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-stretch">
          <PlanCard
            featured
            icon={GraduationCap}
            badge={konten['pricing.hki.badge']}
            code={konten['pricing.hki.code']}
            name={konten['pricing.hki.nama']}
            tagline={konten['pricing.hki.tagline']}
            priceLabel={konten['pricing.hki.labelHarga']}
            price={formatRupiahShort(hkiCicilan)}
            priceUnit={konten['pricing.hki.satuan']}
            priceNote={applyTag(konten['pricing.hki.catatanHarga'], {
              ...tag,
              biayaSemester: formatRupiah(hkiSemester),
            })}
            status={hkiStatus}
            features={fiturHki.map((f) => applyTag(f.judul, tag))}
            primary={{ href: '/program/hki', label: konten['pricing.hki.tombol1'] }}
            secondary={{ href: '/psb', label: konten['pricing.hki.tombol2'] }}
          />

          <PlanCard
            icon={BookOpenText}
            badge={konten['pricing.kias.badge']}
            code={konten['pricing.kias.code']}
            name={konten['pricing.kias.nama']}
            tagline={konten['pricing.kias.tagline']}
            priceLabel={konten['pricing.kias.labelHarga']}
            price={formatRupiahShort(kiasSpp)}
            priceUnit={konten['pricing.kias.satuan']}
            priceNote={
              kias
                ? applyTag(konten['pricing.kias.catatanHarga'], tag)
                : 'Tahun ajaran berjalan'
            }
            status={kiasStatus}
            features={[
              ...fiturKias.map((f) => applyTag(f.judul, tag)),
              applyTag(
                kiasStatus === 'Buka'
                  ? konten['pricing.kias.statusBuka']
                  : konten['pricing.kias.statusTutup'],
                { ...tag, jumlahKelas: String(kelasBuka) },
              ),
            ]}
            primary={{ href: '/program/kias', label: konten['pricing.kias.tombol1'] }}
            secondary={{ href: '/psb', label: konten['pricing.kias.tombol2'] }}
          />
        </div>
      </div>
    </section>
  )
}
