import { FileText, Download, ExternalLink } from 'lucide-react'
import { getKontenItems, getKontenMap } from '@/lib/konten'
import { getIkon } from '@/lib/konten-ikon'

const STAGING_KEY = 'bismillah'
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false
const keySuffix = isStaging ? `?key=${STAGING_KEY}` : ''

/**
 * Section "Materi Panduan" — daftar dokumen (panduan, kalender akademik).
 *
 * Judul section & daftar dokumen diambil dari panel admin
 * (tabel `konten` + `konten_item` grup `materi`). Berkas diunggah lewat panel
 * yang sama; nama filenya otomatis diberi prefix `mahadaly-`.
 */
export async function MateriSection() {
  const [konten, materials] = await Promise.all([
    getKontenMap(),
    getKontenItems('materi', { hanyaTampil: true }),
  ])

  return (
    <section id="materi" className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-secondary">
            <FileText className="h-3.5 w-3.5" />
            {konten['materi.label']}
          </span>
          <h2 className="mt-4 text-3xl font-bold text-brand-primary mb-3">
            {konten['materi.judul']}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{konten['materi.deskripsi']}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((m) => {
            const Icon = getIkon(m.ikon)
            const file = m.fileUrl || '#'
            const fileName = m.fileName || 'dokumen.pdf'
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-gray-100 bg-brand-surface overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg leading-tight">{m.judul}</h3>
                      <p className="text-xs text-blue-100 mt-0.5">{fileName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{m.deskripsi}</p>

                  {m.fileUrl && (
                    <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                      <iframe
                        src={`${file}${keySuffix}`}
                        title={m.judul}
                        className="w-full h-64 sm:h-80"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`${file}${keySuffix}`}
                      download={fileName}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-secondary transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <a
                      href={`${file}${keySuffix}`}
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
