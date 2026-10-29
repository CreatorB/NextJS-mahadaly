import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { getActiveKiasInfo, isKiasPsbOpen, KIAS_DAFTAR_URL, KIAS_JENIS_DAFTAR, splitLines } from '@/lib/kias'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getJenis(slug: string) {
  return prisma.kiasJenisProgram.findUnique({
    where: { slug },
    include: {
      programs: { orderBy: { id: 'asc' } },
      kitab: { orderBy: [{ kelas: 'asc' }, { id: 'asc' }] },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const jenis = await prisma.kiasJenisProgram.findUnique({ where: { slug } })
  if (!jenis) return { title: 'Program tidak ditemukan' }
  return { title: `KIAS ${jenis.namaJenis} | Asy-Syathiby`, description: jenis.tagline ?? undefined }
}

export default async function KiasJenisPage({ params }: Props) {
  const { slug } = await params
  const [jenis, info] = await Promise.all([getJenis(slug), getActiveKiasInfo()])
  if (!jenis) notFound()

  const buka = isKiasPsbOpen(info) && KIAS_JENIS_DAFTAR.includes(jenis.id) && jenis.programs.some((p) => p.statusPsb === 'Buka')
  const kitabPerKelas = new Map<number, typeof jenis.kitab>()
  for (const k of jenis.kitab) {
    const kelas = k.kelas ?? 1
    kitabPerKelas.set(kelas, [...(kitabPerKelas.get(kelas) ?? []), k])
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="gradient-hero text-white py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Link href="/program/kias" className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4" /> Semua program KIAS
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{jenis.namaJenis}</h1>
            <p className="text-lg text-blue-100 mb-6">{jenis.tagline}</p>
            {jenis.roisQism && <p className="text-sm text-blue-200">Rois Qism: {jenis.roisQism}</p>}
          </div>
        </section>

        <section className="py-14 px-4 bg-white">
          <div className="max-w-4xl mx-auto space-y-10">
            {jenis.muqoddimah && (
              <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-3">Muqoddimah</h2>
                <p className="text-slate-700 leading-relaxed">{jenis.muqoddimah}</p>
              </div>
            )}

            {splitLines(jenis.kompetensi).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-3">Standar Kompetensi Lulusan</h2>
                <ul className="space-y-2">
                  {splitLines(jenis.kompetensi).map((k) => (
                    <li key={k} className="flex gap-3 text-slate-700">
                      <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {splitLines(jenis.peserta).length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-3">Peserta</h2>
                <ul className="list-disc pl-6 space-y-1 text-slate-700">
                  {splitLines(jenis.peserta).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {kitabPerKelas.size > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-4">Kitab yang Dipelajari</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[...kitabPerKelas.entries()].map(([kelas, list]) => (
                    <div key={kelas} className="rounded-2xl border border-slate-200 bg-brand-surface p-5">
                      {kitabPerKelas.size > 1 && <h3 className="font-bold text-slate-800 mb-3">Kelas {kelas}</h3>}
                      <ul className="space-y-2 text-sm">
                        {list.map((k) => (
                          <li key={k.id}>
                            <span className="font-semibold text-slate-800">{k.namaKitab}</span>
                            {k.penulis && <span className="text-slate-500"> — {k.penulis}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-brand-primary text-white p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Kelas {jenis.namaJenis}</h2>
              <p className="text-blue-100 mb-6">
{(() => { const n = jenis.programs.filter((p) => p.statusPsb === 'Buka').length; return n > 0 ? `${n} kelas sedang menerima santri baru.` : 'Pendaftaran kelas belum dibuka saat ini.' })()}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {buka && (
                  <a href={KIAS_DAFTAR_URL} className="bg-brand-accent text-brand-primary font-bold px-8 py-3 rounded-xl hover:opacity-90">
                    Daftar Sekarang
                  </a>
                )}
                <Link href="/program/kias#kelas" className="border-2 border-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10">
                  Lihat Jadwal Kelas
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
