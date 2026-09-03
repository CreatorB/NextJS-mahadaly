import { FileText, Download, ExternalLink, BookOpen, Calendar } from 'lucide-react'

const materials = [
  {
    id: 'panduan-akademik',
    title: 'Panduan Akademik',
    description:
      'Pedoman lengkap mahasiswa baru Ma\'had Aly — kurikulum, peraturan akademik, sistem pembelajaran, dan informasi penting lainnya.',
    file: '/materials/panduan-akademik-hki.pdf',
    fileName: 'Panduan-Akademik-HKI.pdf',
    icon: BookOpen,
    accent: 'from-brand-primary to-brand-secondary',
  },
  {
    id: 'kaldik',
    title: 'Kalender Pendidikan (KALDIK)',
    description:
      'Kalender akademik tahun ajaran 2026/2027 — jadwal perkuliahan, ujian, libur, dan kegiatan kemahasiswaan.',
    file: '/materials/kaldik-mahad-aly-2026-2027.pdf',
    fileName: 'KALDIK-MA-2026-2027.pdf',
    icon: Calendar,
    accent: 'from-brand-secondary to-brand-primary',
  },
]

export function MateriSection() {
  return (
    <section id="materi" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-secondary">
            <FileText className="h-3.5 w-3.5" />
            Materi Panduan
          </span>
          <h2 className="mt-4 text-3xl font-bold text-brand-primary mb-3">
            Unduh Panduan &amp; Kalender Akademik
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pelajari lebih lanjut tentang program studi melalui dokumen resmi Ma'had Aly Al-Imam Asy-Syathiby.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {materials.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-gray-100 bg-brand-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`bg-gradient-to-r ${m.accent} px-6 py-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{m.title}</h3>
                      <p className="text-xs text-blue-100 mt-0.5">{m.fileName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {m.description}
                  </p>

                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <iframe
                      src={m.file}
                      title={m.title}
                      className="w-full h-64 sm:h-80"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={m.file}
                      download={m.fileName}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-secondary transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <a
                      href={m.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka di Tab Baru
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}