import Link from 'next/link'
import { Calendar, DollarSign } from 'lucide-react'

const jadwal = [
  { kegiatan: 'Pendaftaran Dibuka', tanggal: '25 Mei 2026' },
  { kegiatan: 'Pendaftaran Ditutup', tanggal: '19 Agustus 2026' },
  { kegiatan: 'Tes Masuk', tanggal: 'Sabtu, 22 Agustus 2026' },
]

const biaya = [
  { item: 'Uang Pendaftaran', nominal: 'Rp 150.000' },
  { item: 'Uang Pangkal', nominal: 'Rp 5.250.000' },
  { item: 'Biaya Kuliah/Semester', nominal: 'Rp 3.000.000' },
  { item: 'Cicilan/Bulan', nominal: 'Rp 500.000' },
]

export function JadwalPsbSection() {
  return (
    <section id="jadwal" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Jadwal & Biaya PMB 2026</h2>
          <p className="text-gray-600">Tahun Ajaran 2026/2027</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-brand-surface rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-brand-primary" />
              <h3 className="font-bold text-brand-primary text-lg">Jadwal PMB</h3>
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
              <h3 className="font-bold text-brand-primary text-lg">Biaya</h3>
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
            <p className="text-xs text-gray-500 mt-3">*Biaya kuliah bisa dicicil Rp 500.000/bulan</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/psb" className="inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg">
            Daftar Sekarang di /psb
          </Link>
        </div>
      </div>
    </section>
  )
}
