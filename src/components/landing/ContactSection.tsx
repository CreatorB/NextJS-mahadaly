import { getKontenItems, getKontenMap } from '@/lib/konten'
import { getIkon } from '@/lib/konten-ikon'

/**
 * Section "Hubungi Kami" di beranda.
 *
 * Kartu kontak diambil dari panel admin
 * (tabel `konten` + `konten_item` grup `kontak`).
 */
export async function ContactSection() {
  const [konten, kontak] = await Promise.all([
    getKontenMap(),
    getKontenItems('kontak', { hanyaTampil: true }),
  ])

  return (
    <section id="kontak" className="py-16 px-4 bg-brand-primary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-accent mb-3">{konten['kontak.judul']}</h2>
          <p className="text-blue-200">{konten['kontak.subjudul']}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kontak.map((c) => {
            const Icon = getIkon(c.ikon)
            return (
              <a
                key={c.id}
                href={c.url || '#'}
                className="bg-white/10 hover:bg-white/20 rounded-xl p-5 transition-colors border border-white/20"
              >
                <Icon className="h-6 w-6 text-brand-accent mb-3" />
                <p className="text-blue-200 text-xs mb-1">{c.judul}</p>
                <p className="font-medium text-sm">{c.deskripsi}</p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
