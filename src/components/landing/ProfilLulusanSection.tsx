import { getKontenItems, getKontenMap } from '@/lib/konten'
import { getIkon } from '@/lib/konten-ikon'

/**
 * Section "Profil Lulusan" di beranda.
 *
 * Judul & daftar profesi diambil dari panel admin
 * (tabel `konten` + `konten_item` grup `lulusan`).
 */
export async function ProfilLulusanSection() {
  const [konten, profil] = await Promise.all([
    getKontenMap(),
    getKontenItems('lulusan', { hanyaTampil: true }),
  ])

  return (
    <section className="py-16 px-4 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">{konten['lulusan.judul']}</h2>
          <p className="text-gray-600">{konten['lulusan.subjudul']}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profil.map((p) => {
            const Icon = getIkon(p.ikon)
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-brand-primary mb-2">{p.judul}</h3>
                <p className="text-sm text-gray-600">{p.deskripsi}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
