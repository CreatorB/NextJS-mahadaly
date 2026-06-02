import Link from 'next/link'
import { BookOpen, Users, Award } from 'lucide-react'
import prisma from '@/lib/prisma'

export async function HeroSection() {
  const info = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
  const tahun = info?.tahunAjaran ?? '2026'
  const biayaDaftar = info?.biayaPendaftaran ?? 150000
  const biayaKuliah = info?.biayaKuliahSemester ?? 3000000
  const cicilan = info?.biayaCicilanBulanan ?? 500000
  return (
    <section className="gradient-hero text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-brand-accent text-brand-primary font-bold px-4 py-1 rounded-full text-sm mb-4">
              TELAH DIBUKA — KUOTA TERBATAS
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Ma'had Aly<br/>
              <span className="text-brand-accent">Al-Imam Asy-Syathiby</span>
            </h1>
            <p className="text-xl font-semibold text-blue-200 mb-2">PMB — Penerimaan Mahasiswa/i Baru</p>
            <p className="text-2xl font-bold text-brand-accent mb-4">Tahun Ajaran {tahun}/{Number(tahun) + 1}</p>
            <p className="text-blue-100 mb-2">Hukum Keluarga Islam (HKI) S1</p>
            <p className="text-blue-200 text-sm mb-8">Program belajar ilmu-ilmu syar'i <em>(bagi yang sudah bisa berbahasa arab pasif)</em></p>
            <p className="text-blue-100 font-medium mb-8">📚 Belajar Selama 4 Tahun & Berijazah S1</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/psb" className="bg-brand-accent text-brand-primary font-bold px-8 py-4 rounded-xl text-center text-lg hover:opacity-90 transition-opacity shadow-lg">
                Daftar Sekarang
              </Link>
              <a href="#jadwal" className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl text-center text-lg hover:bg-white/10 transition-colors">
                Lihat Jadwal
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Waktu Pembelajaran</span>
              </div>
              <div className="text-blue-100 text-sm space-y-1">
                <p>📱 <strong>Jum'at Online</strong> — 20:00 WIB – Selesai</p>
                <p>🏫 <strong>Sabtu Offline</strong> — 07:30 – 15:30 WIB</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Biaya Terjangkau</span>
              </div>
              <div className="text-blue-100 text-sm space-y-1">
                <p>Pendaftaran: <strong className="text-white">Rp {biayaDaftar.toLocaleString('id-ID')}</strong></p>
                <p>Kuliah: <strong className="text-white">Rp {biayaKuliah >= 1000000 ? `${(biayaKuliah / 1000000).toFixed(biayaKuliah % 1000000 === 0 ? 0 : 1)} Juta` : biayaKuliah.toLocaleString('id-ID')}/Semester</strong></p>
                <p className="text-xs text-blue-200">(Bisa dicicil Rp {cicilan.toLocaleString('id-ID')}/bulan)</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-brand-accent" />
                <span className="font-semibold">Kontak</span>
              </div>
              <a href="https://api.whatsapp.com/send?phone=628111516756" className="text-blue-100 text-sm">📞 0811-1516-756</a>
              <p className="text-blue-100 text-sm">🌐 www.mahadaly.syathiby.id</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
