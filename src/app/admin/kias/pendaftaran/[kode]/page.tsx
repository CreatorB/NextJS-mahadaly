import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Printer } from 'lucide-react'
import prisma from '@/lib/prisma'
import { formatRupiah, normalizeNoHp } from '@/lib/kias'
import { kiasWhatsAppLink } from '@/lib/kias-admin'
import { KiasAdminActions } from './KiasAdminActions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Detail Pendaftar KIAS — Admin' }

const tgl = (d: Date | null, jam = false) =>
  d ? d.toLocaleString('id-ID', jam ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'long' }) : '-'

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 break-words">{value || '-'}</dd>
    </div>
  )
}

export default async function AdminKiasDetailPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params
  const s = await prisma.kiasSantri.findUnique({
    where: { kodeRegistrasi: kode },
    include: { program: { include: { jenisProgram: true } }, user: { select: { email: true, isActive: true } } },
  })
  if (!s) notFound()
  const [info, kelas] = await Promise.all([
    prisma.kiasInfoPsb.findUnique({ where: { tahunAjaran: s.tahunPsb } }),
    prisma.kiasProgram.findMany({ orderBy: { id: 'asc' }, select: { id: true, namaProgram: true } }),
  ])
  const berkas = (['photo', 'ktp', 'transfer'] as const).map((f) => ({
    field: f, label: { photo: 'Pas foto', ktp: 'KTP', transfer: 'Bukti transfer' }[f], ada: !!s[f],
  }))

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/kias/pendaftaran?tahun=${s.tahunPsb}`} className="text-sm text-gray-500 hover:text-brand-primary">← Pendaftar KIAS</Link>
          <h1 className="text-2xl font-bold text-brand-primary">{s.nama}</h1>
          <p className="text-sm text-gray-500">
            <span className="font-mono">{s.kodeRegistrasi}</span> · TA {s.tahunPsb} · {s.program?.namaProgram ?? '-'}
          </p>
        </div>
        {s.statusPendaftaran === 'Diterima' && (
          <Link href={`/kias/formulir/${s.kodeRegistrasi}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Formulir F2
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Data diri</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Item label="Jenis kelamin" value={s.jk} />
              <Item label="NIK" value={s.nik} />
              <Item label="NISN" value={s.nisn} />
              <Item label="Tempat, tanggal lahir" value={`${s.tmpLahir ?? '-'}, ${tgl(s.tglLahir)}`} />
              <Item label="Pendidikan" value={s.pendidikan} />
              <Item label="Pekerjaan" value={s.pekerjaan} />
              <Item label="Email" value={s.email} />
              <Item label="No. HP" value={s.hp ? `+${s.hp}` : null} />
              <div className="sm:col-span-2"><Item label="Alamat" value={s.alamat} /></div>
              <Item label="Ayah" value={s.namaAyah ? `${s.namaAyah} (${s.noHpAyah ?? '-'})` : null} />
              <Item label="Ibu" value={s.namaIbu ? `${s.namaIbu} (${s.noHpIbu ?? '-'})` : null} />
              <Item label="Wali" value={s.namaWali ? `${s.namaWali} (${s.noHpWali ?? '-'})` : null} />
              <Item label="Status santri" value={s.status} />
              <Item label="Akun login" value={s.user ? `${s.user.email}${s.user.isActive ? '' : ' (nonaktif)'}` : 'Tidak ada'} />
              <Item label="Tanggal daftar" value={tgl(s.createdAt, true)} />
            </dl>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Berkas</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {berkas.map((b) => (
                <div key={b.field} className="rounded-lg border border-gray-100 p-2">
                  <p className="mb-2 text-xs font-medium text-gray-600">{b.label}</p>
                  {b.ada ? (
                    <a href={`/api/kias/berkas/${s.kodeRegistrasi}/${b.field}`} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/kias/berkas/${s.kodeRegistrasi}/${b.field}`} alt={b.label} className="h-40 w-full rounded object-cover" />
                    </a>
                  ) : (
                    <p className="flex h-40 items-center justify-center rounded bg-gray-50 text-xs text-gray-400">Tidak ada</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <KiasAdminActions
          kode={s.kodeRegistrasi}
          statusPendaftaran={s.statusPendaftaran}
          statusTransfer={s.statusTransfer}
          alasan={s.alasanPenolakan}
          nominal={formatRupiah(s.nominalTransfer || info?.biayaPendaftaran || 0)}
          tglVerifikasi={tgl(s.tglVerifikasi, true)}
          kirimNotifikasi={s.kirimNotifikasi}
          waLink={s.hp ? kiasWhatsAppLink(s, info?.linkGroup) : null}
          kelas={kelas}
          edit={{ nama: s.nama, jk: s.jk, nik: s.nik ?? '', email: s.email ?? '', noHp: s.noHp ? `0${normalizeNoHp(s.noHp)}` : '', programId: s.programId ?? 0, status: s.status }}
        />
      </div>
    </div>
  )
}
