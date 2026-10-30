import Link from 'next/link'
import { PlayCircle } from 'lucide-react'
import { getProfil } from '@/lib/profil'
import { HeroVideo } from '@/components/landing/HeroVideo'

/**
 * Hero landing page — TANPA nuansa PMB.
 * Informasi pendaftaran (kuota, biaya, tanggal) milik halaman /program/*.
 *
 * 30 Okt 2026: kolom kanan diganti video YouTube (autoplay) profil; 4 kartu
 * info (Program Belajar, Waktu Pembelajaran, Santri & Mahasiswa, Kontak)
 * dipindah ke halaman /program/hki. Tombol profil di hero dihapus — cukup
 * link "Lihat Profil" di bawah video. Tombol hero ("Program" + "Pendaftaran")
 * sekarang menggulir ke section "Program Belajar" di halaman ini.
 */
export async function HeroSection() {
  const profil = await getProfil()

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
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              <a
                href="#pilih-program"
                className="bg-brand-accent text-brand-primary font-bold px-8 py-4 rounded-xl text-center text-lg hover:opacity-90 transition-opacity shadow-lg"
              >
                Program
              </a>
              <a
                href="#pilih-program"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl text-center text-lg hover:bg-white/10 transition-colors"
              >
                Pendaftaran
              </a>
            </div>
          </div>

          {/* Video profil (YouTube) — autoplay muted + loop; suara dinyalakan
              otomatis begitu pengunjung berinteraksi (klik/scroll/dll) atau
              jendela sambutan ditutup. */}
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl">
              <div className="aspect-video w-full">
                <HeroVideo
                  videoUrl={profil.videoUrl}
                  title="Video Profil Ma'had Aly Al-Imam Asy-Syathiby"
                  className="h-full w-full"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-blue-100">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4 text-brand-accent" />
                Silahkan aktifkan suara pada menu video
              </span>
              <Link href="/profil" className="font-semibold text-brand-accent hover:underline">
                Lihat Profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
