import { GraduationCap } from 'lucide-react'

const pengajar = [
  'Ust. Dr. Muhammad Yasir, M.A.',
  'Ust. Mukhadasin, M.Pd.',
  'Ust. Rahmat H. Bachtiar, B.A., M.Pd.',
  'Ust. Muhammad Irfandi, B.A., M.A.',
  'Ust. Dr. Cecep Rahmat, Lc., M.Ag.',
  'Ust. Cecep Nurrohman, B.A., M.A.',
  'Ust. Irham Maulana, B.A., M.H.',
  'Ust. Derma Permana, B.A.',
  'Ust. Zahir Al-Minangkabawi',
]

export function PengajarSection() {
  return (
    <section id="pengajar" className="py-16 px-4 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Pembina & Tenaga Pengajar</h2>
          <p className="text-gray-600">Dibimbing oleh para ulama dan akademisi berkompeten</p>
        </div>

        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-brand-accent rounded-full p-4">
              <GraduationCap className="h-8 w-8 text-brand-primary" />
            </div>
            <div>
              <p className="text-blue-200 text-sm">Pembina</p>
              <p className="text-2xl font-bold">Ustadz Badru Salam, Lc.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pengajar.map((nama, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="bg-brand-primary/10 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
                <span className="text-brand-primary font-bold text-sm">{i + 1}</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{nama}</p>
            </div>
          ))}
          <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 flex items-center gap-3">
            <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
              <span className="text-gray-500 text-xl">+</span>
            </div>
            <p className="text-sm text-gray-500 italic">Dan pengajar lainnya</p>
          </div>
        </div>
      </div>
    </section>
  )
}
