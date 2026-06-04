import { BookOpen } from 'lucide-react'

const kurikulum = [
  { semester: 1, fokus: 'Studi Islam Umum, Bahasa Arab, Bahasa Inggris, Pancasila', sks: 20 },
  { semester: 2, fokus: 'Teologi Islam, Hukum Keluarga Dasar, Studi Quran & Hadits', sks: 20 },
  { semester: 3, fokus: 'Hukum Islam Spesialisasi — Tahap I', sks: 24 },
  { semester: 4, fokus: 'Hukum Islam Spesialisasi — Tahap II', sks: 24 },
  { semester: 5, fokus: 'Keterampilan Terapan — Tahap I', sks: 24 },
  { semester: 6, fokus: 'Keterampilan Terapan & Praktikum', sks: 24 },
  { semester: 7, fokus: 'Magang, Ujian Komprehensif, KKN', sks: 11 },
  { semester: 8, fokus: 'Skripsi', sks: 4 },
]

export function KurikulumSection() {
  return (
    <section id="kurikulum" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Kurikulum S1 HKI</h2>
          <p className="text-gray-600">8 semester (4 tahun) · 156 SKS</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-primary text-white">
                <th className="px-4 py-3 text-left rounded-tl-lg">Semester</th>
                <th className="px-4 py-3 text-left">Fokus Kajian</th>
                <th className="px-4 py-3 text-center rounded-tr-lg">SKS</th>
              </tr>
            </thead>
            <tbody>
              {kurikulum.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-surface'}>
                  <td className="px-4 py-3 font-medium text-brand-primary">Semester {row.semester}</td>
                  <td className="px-4 py-3 text-gray-700">{row.fokus}</td>
                  <td className="px-4 py-3 text-center font-bold text-brand-secondary">{row.sks}</td>
                </tr>
              ))}
              <tr className="bg-brand-primary text-white font-bold">
                <td className="px-4 py-3 rounded-bl-lg">Total</td>
                <td className="px-4 py-3">138 SKS Wajib + 18 SKS Pilihan</td>
                <td className="px-4 py-3 text-center rounded-br-lg">156</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 max-w-xl mx-auto">
          {[
            { label: 'Total SKS', value: '156' },
            { label: 'Min. Kelulusan', value: '146 SKS' },
          ].map((s, i) => (
            <div key={i} className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl p-4 text-white text-center">
              <p className="text-2xl font-bold text-brand-accent">{s.value}</p>
              <p className="text-blue-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
