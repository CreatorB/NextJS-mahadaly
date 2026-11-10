import Link from 'next/link'
import { Calendar, DollarSign } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getKontenMap, getKontenTag } from '@/lib/konten'
import { applyTag } from '@/lib/konten-shared'

/**
 * Section "Jadwal & Biaya PMB".
 *
 * Tanggal & nominal tetap dari tabel PSB (dikelola di Pengaturan PSB),
 * sedangkan LABEL, tanggal tes masuk, dan catatan cicilan bisa disunting
 * dari panel admin (tabel `konten`).
 */
export async function JadwalPsbSection({ showCta = true }: { showCta?: boolean } = {}) {
  const [info, konten, tag] = await Promise.all([
    prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } }),
    getKontenMap(),
    getKontenTag(),
  ])

  const jadwal = [
    {
      kegiatan: applyTag(konten['jadwal.labelBuka'], tag),
      tanggal: info?.datetimeOpen
        ? new Date(info.datetimeOpen).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '-',
    },
    {
      kegiatan: applyTag(konten['jadwal.labelTutup'], tag),
      tanggal: info?.datetimeClosed
        ? new Date(info.datetimeClosed).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : '-',
    },
    {
      kegiatan: applyTag(konten['jadwal.labelTes'], tag),
      tanggal: applyTag(konten['jadwal.tesMasuk'], tag),
    },
  ]

  const biaya = [
    {
      item: applyTag(konten['jadwal.biayaDaftar'], tag),
      nominal: info?.biayaPendaftaran
        ? `Rp ${Number(info.biayaPendaftaran).toLocaleString('id-ID')}`
        : 'Rp 150.000',
    },
    {
      item: applyTag(konten['jadwal.biayaPangkal'], tag),
      nominal: info?.biayaPangkal
        ? `Rp ${Number(info.biayaPangkal).toLocaleString('id-ID')}`
        : 'Rp 5.250.000',
    },
    {
      item: applyTag(konten['jadwal.biayaSemester'], tag),
      nominal: info?.biayaKuliahSemester
        ? `Rp ${Number(info.biayaKuliahSemester).toLocaleString('id-ID')}`
        : 'Rp 3.000.000',
    },
    {
      item: applyTag(konten['jadwal.biayaCicilan'], tag),
      nominal: info?.biayaCicilanBulanan
        ? `Rp ${Number(info.biayaCicilanBulanan).toLocaleString('id-ID')}`
        : 'Rp 500.000',
    },
  ]

  const cicilan = info?.biayaCicilanBulanan ?? 500000

  return (
    <section id="jadwal" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">
            {applyTag(konten['jadwal.judul'], tag)}
          </h2>
          <p className="text-gray-600">{applyTag(konten['jadwal.subjudul'], tag)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-brand-surface rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-brand-primary" />
              <h3 className="font-bold text-brand-primary text-lg">
                {konten['jadwal.judulTabel']}
              </h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {jadwal.map((j, i) => (
                  <tr key={i} className="border-b border-gray-200 last:border-0">
                    <td className="py-3 text-gray-600">{j.kegiatan}</td>
                    <td className="py-3 font-semibold text-brand-primary text-right">{j.tanggal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-brand-surface rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-6 w-6 text-brand-primary" />
              <h3 className="font-bold text-brand-primary text-lg">{konten['jadwal.biayaJudul']}</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {biaya.map((b, i) => (
                  <tr key={i} className="border-b border-gray-200 last:border-0">
                    <td className="py-3 text-gray-600">{b.item}</td>
                    <td className="py-3 font-semibold text-brand-primary text-right">{b.nominal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-3">
              {applyTag(konten['jadwal.catatanBiaya'], { ...tag, biayaCicilan: cicilan.toLocaleString('id-ID') })}
            </p>
          </div>
        </div>

        {showCta && (
          <div className="text-center">
            <Link
              href="/psb"
              className="inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              {konten['jadwal.cta']}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
