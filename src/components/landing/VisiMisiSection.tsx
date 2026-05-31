import { Target, Eye } from 'lucide-react'

const misi = [
  'Menyelenggarakan pendidikan dan pengajaran unggul dalam bidang Hukum Keluarga Islam.',
  'Mengembangkan penelitian dan kajian ilmiah yang responsif terhadap kebutuhan masyarakat.',
  'Melaksanakan pengabdian kepada masyarakat berbasis pendidikan dan penelitian.',
  'Membangun kemitraan dan jaringan kerjasama strategis.',
]

export function VisiMisiSection() {
  return (
    <section id="program" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Visi & Misi</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-7 w-7 text-brand-accent" />
              <h3 className="text-xl font-bold">Visi</h3>
            </div>
            <p className="text-blue-100 leading-relaxed">
              Menjadi Program Studi Hukum Keluarga Islam unggulan dalam melahirkan generasi ulama rabbani yang profesional, sarjana hukum yang mutqin, kokoh dalam manhaj, serta adaptif terhadap dinamika keberagamaan.
            </p>
          </div>
          <div className="bg-brand-surface rounded-2xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-7 w-7 text-brand-primary" />
              <h3 className="text-xl font-bold text-brand-primary">Misi</h3>
            </div>
            <ol className="space-y-3">
              {misi.map((m, i) => (
                <li key={i} className="flex gap-3 text-gray-700 text-sm">
                  <span className="bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {m}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
