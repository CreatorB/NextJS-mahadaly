import { Scale, FileText, Briefcase, FlaskConical } from 'lucide-react'

const profil = [
  { icon: Scale, title: 'Hakim', desc: 'Praktisi peradilan agama di lingkungan Mahkamah Agung RI' },
  { icon: FileText, title: 'Notaris Syariah', desc: 'Pejabat pembuat akta berbasis prinsip syariah' },
  { icon: Briefcase, title: 'Advokat Syariah', desc: 'Konsultan dan pendamping hukum berbasis hukum Islam' },
  { icon: FlaskConical, title: 'Asisten Peneliti', desc: 'Tenaga peneliti di lembaga kajian hukum Islam & perguruan tinggi' },
]

export function ProfilLulusanSection() {
  return (
    <section className="py-16 px-4 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-primary mb-3">Profil Lulusan</h2>
          <p className="text-gray-600">Lulusan disiapkan untuk berkarier sebagai profesional hukum Islam</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {profil.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <p.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-brand-primary mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
