import Link from 'next/link'
import { Building2, CalendarX } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import {
  formatRupiah, getActiveKiasInfo, getKiasQuota, isKiasPsbOpen,
  KIAS_JENIS_DAFTAR, KIAS_PENDIDIKAN, KIAS_REKENING,
} from '@/lib/kias'
import { KiasDaftarForm } from './KiasDaftarForm'

/** Dipakai juga oleh /kias/daftar/manual (mode manual = tanpa batas kuota, butuh password). */
export async function KiasDaftarView({ manual = false }: { manual?: boolean } = {}) {
  const info = await getActiveKiasInfo()
  const open = isKiasPsbOpen(info)

  const [programs, pekerjaan, quota] = await Promise.all([
    prisma.kiasProgram.findMany({
      where: { statusPsb: 'Buka', jenisProgramId: { in: KIAS_JENIS_DAFTAR } },
      include: { jenisProgram: true },
      orderBy: [{ jenisProgram: { urutan: 'asc' } }, { id: 'asc' }],
    }),
    prisma.kiasPekerjaan.findMany({ orderBy: { nama: 'asc' } }),
    info ? getKiasQuota(info) : null,
  ])
  const biaya = info?.biayaPendaftaran ?? 150000
  const fmtTgl = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <>
      <Navbar />
      <main className="bg-brand-surface py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/kias" className="text-sm text-slate-500 hover:text-brand-primary">← Program KIAS</Link>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-brand-primary">
              Pendaftaran KIAS {info?.tahunAjaran}
              {manual && <span className="ml-3 align-middle rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">Manual</span>}
            </h1>
            <p className="text-slate-600 mt-1">Kursus Ilmu bahasa Arab &amp; Syar&apos;i — Ma&apos;had Imam Asy-Syathiby</p>
          </div>

          {!open || programs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <CalendarX className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Pendaftaran sedang ditutup</h2>
              <p className="text-slate-600 mb-6">
                {info?.datetimeOpen && info.datetimeOpen > new Date()
                  ? `Pendaftaran dibuka mulai ${fmtTgl(info.datetimeOpen)}.`
                  : 'Pantau pengumuman pembukaan pendaftaran berikutnya di halaman KIAS dan Instagram @kias_syathiby.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/kias" className="rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white">Lihat Program KIAS</Link>
                <Link href="/login" className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">Login Peserta</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
              <KiasDaftarForm
                programs={programs.map((p) => ({
                  id: p.id,
                  label: `${p.namaProgram} — ${p.hariBelajar ?? ''} ${p.waktuBelajar ?? ''}`.trim(),
                  jenis: p.jenisProgram.namaJenis,
                  persyaratan: p.persyaratan && p.persyaratan !== '-' ? p.persyaratan : null,
                }))}
                pekerjaan={pekerjaan.map((p) => p.nama)}
                pendidikan={KIAS_PENDIDIKAN}
              />

              <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-6 text-white shadow-lg">
                  <p className="text-sm text-blue-100">Biaya pendaftaran</p>
                  <p className="text-3xl font-extrabold mb-4">{formatRupiah(biaya)}</p>
                  <div className="rounded-xl bg-white/10 p-4 text-sm space-y-1">
                    <p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Transfer ke</p>
                    <p>{KIAS_REKENING.bank}</p>
                    <p className="text-xl font-bold tracking-wider text-brand-accent">{KIAS_REKENING.nomor}</p>
                    <p>a.n. {KIAS_REKENING.atasNama}</p>
                  </div>
                  <ol className="mt-4 list-decimal pl-5 text-sm text-blue-50 space-y-1">
                    <li>Transfer sesuai nominal biaya pendaftaran</li>
                    <li>Simpan bukti transfer</li>
                    <li>Upload bukti di formulir ini</li>
                    <li>Verifikasi maksimal 1x24 jam kerja</li>
                  </ol>
                </div>

                {info && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm space-y-2">
                    {info.datetimeClosed && <p><span className="text-slate-500">Ditutup:</span> <strong>{fmtTgl(info.datetimeClosed)}</strong></p>}
                    {quota?.sisaIkhwan != null && <p><span className="text-slate-500">Sisa kuota ikhwan:</span> <strong>{quota.sisaIkhwan}</strong></p>}
                    {quota?.sisaAkhwat != null && <p><span className="text-slate-500">Sisa kuota akhwat:</span> <strong>{quota.sisaAkhwat}</strong></p>}
                  </div>
                )}

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                  <p className="font-semibold mb-1">Informasi login</p>
                  <p>Email: email yang Anda isi di formulir.</p>
                  <p>Password: Nomor Peserta yang Anda terima setelah pendaftaran berhasil.</p>
                  <p className="mt-2">Link grup WhatsApp muncul di dashboard setelah pembayaran dikonfirmasi admin.</p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
