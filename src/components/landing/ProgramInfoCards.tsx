import Link from 'next/link'
import { BookOpen, Users, Award, Compass } from 'lucide-react'
import { getCatalogRekap } from '@/lib/program-catalog'
import { getKontenMap } from '@/lib/konten'

/**
 * Kartu informasi program — dipakai di halaman /program/hki.
 *
 * Label kartu diambil dari panel admin (tabel `konten`); angka pendaftar
 * dan jumlah program tetap dihitung dari data.
 */
export async function ProgramInfoCards() {
  const [rekap, konten] = await Promise.all([getCatalogRekap(), getKontenMap()])
  const programs = rekap.programs

  const card =
    'rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(0,54,124,0.4)]'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10">
            <Compass className="h-5 w-5 text-brand-primary" />
          </span>
          <span className="font-semibold text-brand-primary">{konten['hki.kartu.programLabel']}</span>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-600">
          {programs.map((p) => (
            <li key={p.slug} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent ring-1 ring-brand-primary/20" />
              <span>
                <Link href={p.detailUrl} className="font-semibold text-brand-primary hover:underline">
                  {p.nama}
                </Link>{' '}
                {p.jenjang ? <span className="text-gray-500">({p.jenjang})</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-secondary/10">
            <BookOpen className="h-5 w-5 text-brand-secondary" />
          </span>
          <span className="font-semibold text-brand-primary">{konten['hki.kartu.jadwalLabel']}</span>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>{konten['hki.kartu.jumat']}</p>
          <p>{konten['hki.kartu.sabtu']}</p>
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light/15">
            <Users className="h-5 w-5 text-brand-light" />
          </span>
          <span className="font-semibold text-brand-primary">{konten['hki.kartu.santriLabel']}</span>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            {konten['hki.kartu.totalPendaftaran']}{' '}
            <strong className="text-brand-primary">
              {rekap.totalPendaftar.toLocaleString('id-ID')} orang
            </strong>
          </p>
          <p>
            {konten['hki.kartu.tersediaProgram']}{' '}
            <strong className="text-brand-primary">{programs.length} program belajar</strong>
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/40">
            <Award className="h-5 w-5 text-brand-primary" />
          </span>
          <span className="font-semibold text-brand-primary">{konten['hki.kartu.kontakLabel']}</span>
        </div>
        <a
          href="https://api.whatsapp.com/send?phone=628111516756"
          className="text-sm font-medium text-brand-secondary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {konten['hki.kartu.kontakWa']}
        </a>
        <p className="text-sm text-gray-600">{konten['hki.kartu.kontakWeb']}</p>
      </div>
    </div>
  )
}
