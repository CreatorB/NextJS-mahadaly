import Link from 'next/link'
import { Target, Eye, ArrowRight } from 'lucide-react'
import { getProfil, sanitizeProfilKonten } from '@/lib/profil'

/**
 * Section "Visi & Misi" di beranda.
 *
 * Isi diambil dari tabel `profil` (kolom `visi` & `misi`) supaya bisa disunting
 * admin lewat editor WYSIWYG di /admin/profil. Teks yang sama juga dipakai
 * halaman penuh /visi-misi.
 */
export async function VisiMisiSection() {
  const profil = await getProfil()
  const visi = sanitizeProfilKonten(profil.visi ?? '')
  const misi = sanitizeProfilKonten(profil.misi ?? '')

  return (
    <section id="program" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Visi &amp; Misi</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-7 w-7 text-brand-accent" />
              <h3 className="text-xl font-bold">Visi</h3>
            </div>
            <div className="prose-berita prose-kartu-gelap leading-relaxed" dangerouslySetInnerHTML={{ __html: visi }} />
          </div>
          <div className="bg-brand-surface rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-7 w-7 text-brand-primary" />
              <h3 className="text-xl font-bold text-brand-primary">Misi</h3>
            </div>
            <div className="prose-berita text-sm" dangerouslySetInnerHTML={{ __html: misi }} />
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/visi-misi"
            className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:opacity-80"
          >
            Selengkapnya tentang Visi &amp; Misi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
