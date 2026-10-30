import Link from 'next/link'
import { BookOpen, Users, Award, Compass } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getCatalogRekap } from '@/lib/program-catalog'

/**
 * Hero landing page — TANPA nuansa PMB.
 * Informasi pendaftaran (kuota, biaya, tanggal) milik halaman /program/*.
 */
export async function HeroSection() {
  const [info, rekap] = await Promise.all([
    prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } }),
    getCatalogRekap(),
  ])
  const tahun = info?.tahunAjaran ?? '2026'
  const programs = rekap.programs

  return (
    <section className="gradient-hero text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-brand-accent text-brand-primary font-bold px-4 py-1 rounded-full text-sm mb-4">
              MA&apos;HAD ALY AL-IMAM ASY-SYATHIBY
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Ma&apos;had Aly
              <br />
              <span className="text-brand-accent">Al-Imam Asy-Syathiby</span>
            </h1>
            <p className="text-2xl font-bold text-brand-accent mb-4">
              Belajar 4 Tahun &amp; Berijazah S1
            </p>
            <p className="text-blue-100 mb-8">
              Hukum Keluarga Islam (HKI) S1 — program belajar ilmu-ilmu syar&apos;i{' '}
              <em>(bagi yang sudah bisa berbahasa arab pasif)</em>
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/program/hki"
                className="bg-brand-accent text-brand-primary font-bold px-8 py-4 rounded-xl text-center text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                Pelajari Program
              </Link>
              <Link
                href="/psb"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl text-center text-lg hover:bg-white/10 transition-colors"
              >
                Pendaftaran {tahun}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Compass className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Program Belajar</span>
              </div>
              <ul className="text-blue-100 text-sm space-y-1.5">
                {programs.map((p) => (
                  <li key={p.slug} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" />
                    <span>
                      <Link href={p.detailUrl} className="text-white font-semibold hover:underline">
                        {p.nama}
                      </Link>{' '}
                      {p.jenjang ? `(${p.jenjang})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Waktu Pembelajaran</span>
              </div>
              <div className="text-blue-100 text-sm space-y-1">
                <p>
                  📱 <strong>Jum&apos;at Online</strong> — 20:00 WIB – Selesai
                </p>
                <p>
                  🏫 <strong>Sabtu Offline</strong> — 07:30 – 15:30 WIB
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Santri &amp; Mahasiswa</span>
              </div>
              <div className="text-blue-100 text-sm space-y-1">
                <p>
                  Total terdaftar:{' '}
                  <strong className="text-white">
                    {rekap.totalPendaftar.toLocaleString('id-ID')} orang
                  </strong>
                </p>
                <p>
                  Tersedia: <strong className="text-white">{programs.length} program belajar</strong>
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Kontak</span>
              </div>
              <a
                href="https://api.whatsapp.com/send?phone=628111516756"
                className="text-blue-100 text-sm"
              >
                📞 0811-1516-756
              </a>
              <p className="text-blue-100 text-sm">🌐 www.mahadaly.syathiby.id</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
