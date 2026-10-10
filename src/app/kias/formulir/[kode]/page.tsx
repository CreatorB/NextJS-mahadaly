import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/kias'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Formulir F2 KIAS', robots: { index: false } }

const tgl = (d: Date | null | undefined, withTime = false) =>
  d
    ? d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      })
    : '-'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-200 last:border-0">
      <td className="w-48 py-1.5 pr-4 align-top text-gray-600">{label}</td>
      <td className="py-1.5 font-medium text-gray-900">{value || '-'}</td>
    </tr>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-brand-primary pb-1 text-sm font-bold uppercase tracking-wide text-brand-primary">{title}</h2>
      <table className="w-full text-sm"><tbody>{children}</tbody></table>
    </section>
  )
}

/** Formulir F2 (bukti pendaftaran diterima) — pemilik akun atau admin; hanya untuk pendaftar berstatus Diterima. */
export default async function KiasFormulirPage({ params }: { params: Promise<{ kode: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const { kode } = await params

  const s = await prisma.kiasSantri.findUnique({
    where: { kodeRegistrasi: kode },
    include: { program: { include: { jenisProgram: true } }, user: { select: { id: true } } },
  })
  if (!s) notFound()
  const isAdmin = session.roleId <= 2
  if (!isAdmin && s.user?.id !== session.userId) notFound()

  const back = isAdmin ? `/admin/kias/pendaftaran/${s.kodeRegistrasi}` : '/dashboard/kias'
  if (s.statusPendaftaran !== 'Diterima') {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <p className="mb-4 text-gray-600">Formulir F2 tersedia setelah pendaftaran dinyatakan <strong>Diterima</strong>.</p>
        <Link href={back} className="font-semibold text-brand-primary">← Kembali</Link>
      </main>
    )
  }
  const info = await prisma.kiasInfoPsb.findUnique({ where: { tahunAjaran: s.tahunPsb } })

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-between print:hidden">
        <Link href={back} className="text-sm font-semibold text-brand-primary">← Kembali</Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl rounded-xl bg-white p-10 shadow print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="mb-6 border-b-4 border-double border-brand-primary pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Ma&apos;had Imam Asy-Syathiby — KIAS</p>
          <h1 className="text-xl font-extrabold text-brand-primary">FORMULIR PENDAFTARAN F2</h1>
          <p className="text-sm text-gray-600">Tahun Ajaran {s.tahunPsb}</p>
        </header>

        <Section title="Data Diri">
          <Row label="No. Registrasi" value={<span className="font-mono">{s.kodeRegistrasi}</span>} />
          <Row label="Nama Lengkap" value={s.nama.toUpperCase()} />
          <Row label="NIK" value={s.nik} />
          <Row label="NISN" value={s.nisn} />
          <Row label="Jenis Kelamin" value={s.jk === 'Laki-Laki' ? 'Ikhwan (Laki-laki)' : 'Akhwat (Perempuan)'} />
          <Row label="Tempat, Tgl Lahir" value={`${s.tmpLahir ?? '-'}, ${tgl(s.tglLahir)}`} />
          <Row label="Alamat" value={s.alamat} />
          <Row label="Email" value={s.email} />
          <Row label="No. HP" value={s.hp} />
        </Section>

        <Section title="Data Orang Tua / Wali">
          <Row label="Nama Ayah" value={s.namaAyah} />
          <Row label="No. HP Ayah" value={s.noHpAyah} />
          <Row label="Nama Ibu" value={s.namaIbu} />
          <Row label="No. HP Ibu" value={s.noHpIbu} />
          {s.namaWali && <Row label="Nama Wali" value={s.namaWali} />}
          {s.namaWali && <Row label="No. HP Wali" value={s.noHpWali} />}
        </Section>

        <Section title="Program">
          <Row label="Jenjang" value={s.program?.jenisProgram.namaJenis} />
          <Row label="Kelas" value={s.program?.namaProgram} />
          <Row label="Jadwal" value={s.program ? `${s.program.hariBelajar ?? ''} ${s.program.waktuBelajar ?? ''} · ${s.program.tempatBelajar ?? ''}` : '-'} />
        </Section>

        <Section title="Pembayaran">
          <Row label="Biaya Pendaftaran" value={formatRupiah(s.nominalTransfer || info?.biayaPendaftaran || 0)} />
          <Row label="Status" value={s.statusTransfer === 'Valid' ? 'LUNAS' : s.statusTransfer} />
        </Section>

        <Section title="Konfirmasi Penerimaan">
          <Row label="Tanggal Verifikasi" value={tgl(s.tglVerifikasi, true)} />
          <Row label="Status Pendaftaran" value="DITERIMA" />
        </Section>

        <footer className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-500">
          Dicetak pada {tgl(new Date(), true)} · Formulir ini adalah bukti pendaftaran yang sah. Simpan dokumen ini dengan baik.
        </footer>
      </article>
    </main>
  )
}
