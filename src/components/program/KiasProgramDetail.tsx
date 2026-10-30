import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, MapPin, Timer } from 'lucide-react'
import { ContactSection } from '@/components/landing/ContactSection'
import { formatRupiah, getActiveKiasInfo, getKiasJenisPrograms, isKiasPsbOpen, KIAS_DAFTAR_URL } from '@/lib/kias'

/**
 * Detail program KIAS — dipakai oleh /program/kias.
 * Form pendaftarannya tetap di /kias/daftar.
 */
export async function KiasProgramDetail() {
  const [info, jenis] = await Promise.all([getActiveKiasInfo(), getKiasJenisPrograms()])
  const buka = isKiasPsbOpen(info)

  const biaya = [
    { item: 'Pendaftaran', nominal: info?.biayaPendaftaran ?? 150000, note: 'sekali bayar' },
    {
      item: 'Sarana & Prasarana',
      nominal: info?.biayaSaranaPrasarana ?? 300000,
      note: 'sekali bayar',
    },
    ...(info?.biayaKuliahPerdana
      ? [{ item: 'Kuliah Perdana', nominal: info.biayaKuliahPerdana, note: 'sekali bayar' }]
      : []),
    { item: 'SPP', nominal: info?.biayaSppBulanan ?? 250000, note: 'per bulan' },
  ]

  return (
    <>
      <section className="gradient-hero text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span
            className={`inline-block font-bold px-4 py-1 rounded-full text-sm mb-4 ${
              buka ? 'bg-brand-accent text-brand-primary' : 'bg-white/15 text-white'
            }`}
          >
            {buka ? `PENDAFTARAN ${info?.tahunAjaran ?? ''} DIBUKA` : 'PENDAFTARAN BELUM DIBUKA'}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            KIAS <span className="text-brand-accent">Asy-Syathiby</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Kursus Ilmu bahasa Arab &amp; Syar&apos;i — belajar bertahap dari tajwid hingga membaca
            kitab ulama.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {buka && (
              <a
                href={KIAS_DAFTAR_URL}
                className="bg-brand-accent text-brand-primary font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                Daftar KIAS
              </a>
            )}
            <a
              href="#kelas"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors"
            >
              Lihat Jadwal Kelas
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-primary text-center mb-3">Jenjang Program</h2>
          <p className="text-slate-600 text-center mb-10">
            Pilih jenjang sesuai kemampuan Anda saat ini.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {jenis.map((j, idx) => {
              const kelasBuka = j.programs.filter((p) => p.statusPsb === 'Buka').length
              return (
                <Link
                  key={j.id}
                  href={`/kias/${j.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-brand-surface p-6 hover:shadow-lg hover:border-brand-secondary transition"
                >
                  <span className="text-xs font-bold tracking-widest text-brand-secondary mb-2">
                    JENJANG {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-brand-primary mb-2">{j.namaJenis}</h3>
                  <p className="text-sm text-slate-600 flex-1">{j.tagline}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className={kelasBuka ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      {kelasBuka
                        ? `${kelasBuka} kelas ${buka ? 'dibuka' : 'tersedia'}`
                        : 'Belum dibuka'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-brand-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section id="biaya" className="py-16 px-4 bg-brand-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-primary text-center mb-3">Biaya KIAS</h2>
          <p className="text-slate-600 text-center mb-8">
            Tahun ajaran {info?.tahunAjaran ?? 'berjalan'}
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {biaya.map((b) => (
              <div key={b.item} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{b.item}</p>
                  <p className="text-xs text-slate-500">{b.note}</p>
                </div>
                <p className="text-lg font-bold text-brand-primary">{formatRupiah(b.nominal)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kelas" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-primary text-center mb-10">Jadwal Kelas</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jenis
              .flatMap((j) =>
                j.programs
                  .filter((p) => p.statusPsb === 'Buka')
                  .map((p) => ({ ...p, jenisNama: j.namaJenis })),
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ borderTopWidth: 4, borderTopColor: p.warna ?? undefined }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
                        {p.jenisNama}
                      </p>
                      <h4 className="font-bold text-slate-900">{p.namaProgram}</h4>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {buka ? 'Dibuka' : 'Tersedia'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {p.hariBelajar && (
                      <li className="flex gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-brand-secondary" />
                        {p.hariBelajar}
                      </li>
                    )}
                    {p.waktuBelajar && (
                      <li className="flex gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-brand-secondary" />
                        {p.waktuBelajar} WIB
                      </li>
                    )}
                    {p.tempatBelajar && (
                      <li className="flex gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-brand-secondary" />
                        {p.tempatBelajar}
                      </li>
                    )}
                    {p.durasiBelajar && (
                      <li className="flex gap-2">
                        <Timer className="h-4 w-4 shrink-0 text-brand-secondary" />
                        {p.durasiBelajar} tahun
                      </li>
                    )}
                  </ul>
                  {p.persyaratan && p.persyaratan !== '-' && (
                    <p className="mt-3 text-xs text-slate-500">Syarat: {p.persyaratan}</p>
                  )}
                  {buka && (
                    <a
                      href={KIAS_DAFTAR_URL}
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Daftar kelas ini
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </>
  )
}
