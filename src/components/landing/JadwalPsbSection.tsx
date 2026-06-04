import Link from 'next/link'
import { Calendar, DollarSign } from 'lucide-react'
import prisma from '@/lib/prisma'

export async function JadwalPsbSection() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })

  const jadwal = [
    { kegiatan: 'Pendaftaran Dibuka', tanggal: info?.datetimeOpen ? new Date(info.datetimeOpen).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' },
    { kegiatan: 'Pendaftaran Ditutup', tanggal: info?.datetimeClosed ? new Date(info.datetimeClosed).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-' },
    { kegiatan: 'Tes Masuk', tanggal: 'Sabtu, 22 Agustus 2026' },
  ]

  const biaya = [
    { item: 'Uang Pendaftaran', nominal: info?.biayaPendaftaran ? `Rp ${Number(info.biayaPendaftaran).toLocaleString('id-ID')}` : 'Rp 150.000' },
    { item: 'Uang Pangkal', nominal: info?.biayaPangkal ? `Rp ${Number(info.biayaPangkal).toLocaleString('id-ID')}` : 'Rp 5.250.000' },
    { item: 'Biaya Kuliah/Semester', nominal: info?.biayaKuliahSemester ? `Rp ${Number(info.biayaKuliahSemester).toLocaleString('id-ID')}` : 'Rp 3.000.000' },
    { item: 'Cicilan/Bulan', nominal: info?.biayaCicilanBulanan ? `Rp ${Number(info.biayaCicilanBulanan).toLocaleString('id-ID')}` : 'Rp 500.000' },
  ]

  const cicilan = info?.biayaCicilanBulanan ?? 500000

  return (
    <section id="jadwal" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Jadwal & Biaya PMB {info?.tahunAjaran ?? '2026'}</h2>
          <p className="text-gray-600">Tahun Ajaran {info?.tahunAjaran ? `${info.tahunAjaran}/${Number(info.tahunAjaran) + 1}` : '2026/2027'}</p>
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
            <p className="text-xs text-gray-500 mt-3">*Biaya kuliah bisa dicicil Rp {cicilan.toLocaleString('id-ID')}/bulan</p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/psb" className="inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </section>
  )
}