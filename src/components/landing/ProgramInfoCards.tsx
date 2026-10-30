import Link from 'next/link'
import { BookOpen, Users, Award, Compass } from 'lucide-react'
import { getCatalogRekap } from '@/lib/program-catalog'

/**
 * Kartu informasi program — PUNYA DARI HERO LANDING PAGE (30 Okt 2026).
 *
 * Dipindahkan ke halaman /program/hki karena isinya didominasi info Ma'had Aly
 * (jadwal belajar, jumlah pendaftar, kontak). Landing page sekarang memakai
 * video YouTube autoplay di kolom kanan.
 */
export async function ProgramInfoCards() {
  const rekap = await getCatalogRekap()
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
          <span className="font-semibold text-brand-primary">Program Belajar</span>
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
          <span className="font-semibold text-brand-primary">Waktu Pembelajaran</span>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            📱 <strong className="text-gray-800">Jum&apos;at Online</strong> — 20:00 WIB – Selesai
          </p>
          <p>
            🏫 <strong className="text-gray-800">Sabtu Offline</strong> — 07:30 – 15:30 WIB
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light/15">
            <Users className="h-5 w-5 text-brand-light" />
          </span>
          <span className="font-semibold text-brand-primary">Santri &amp; Mahasiswa</span>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            Total terdaftar:{' '}
            <strong className="text-brand-primary">{rekap.totalPendaftar.toLocaleString('id-ID')} orang</strong>
          </p>
          <p>
            Tersedia: <strong className="text-brand-primary">{programs.length} program belajar</strong>
          </p>
        </div>
      </div>

      <div className={card}>
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/40">
            <Award className="h-5 w-5 text-brand-primary" />
          </span>
          <span className="font-semibold text-brand-primary">Kontak</span>
        </div>
        <a
          href="https://api.whatsapp.com/send?phone=628111516756"
          className="text-sm font-medium text-brand-secondary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          📞 0811-1516-756
        </a>
        <p className="text-sm text-gray-600">🌐 www.mahadaly.syathiby.id</p>
      </div>
    </div>
  )
}
