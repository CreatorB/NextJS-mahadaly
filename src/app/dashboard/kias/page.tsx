import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, CheckCircle2, Clock, XCircle, MessageCircle, BookOpenText, Wallet, FileImage, Printer, UserPen } from 'lucide-react'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { formatRupiah } from '@/lib/kias'
import { MarkAllReadButton, RevisiBerkasForm } from './KiasDashboardClient'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard KIAS — Asy-Syathiby' }

const PENDAFTARAN: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  Menunggu: { label: 'Menunggu', cls: 'bg-yellow-100 text-yellow-800', icon: Clock },
  Diterima: { label: 'Diterima', cls: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  Ditolak: { label: 'Ditolak', cls: 'bg-red-100 text-red-800', icon: XCircle },
}
const TRANSFER: Record<string, { label: string; cls: string }> = {
  Valid: { label: 'LUNAS', cls: 'bg-green-100 text-green-800' },
  Cek: { label: 'SEDANG DIVERIFIKASI', cls: 'bg-yellow-100 text-yellow-800' },
  Invalid: { label: 'TIDAK VALID', cls: 'bg-red-100 text-red-800' },
}

export default async function KiasDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      kiasSantri: { include: { program: { include: { jenisProgram: true } } } },
      kiasNotifications: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  const santri = user?.kiasSantri
  if (!user || !santri) {
    return <div className="p-8 text-center text-gray-500">Data pendaftaran KIAS tidak ditemukan. Silakan hubungi admin.</div>
  }

  const info = await prisma.kiasInfoPsb.findUnique({ where: { tahunAjaran: santri.tahunPsb } })
  const linkGroup = santri.statusTransfer === 'Valid' ? info?.linkGroup : null
  const st = PENDAFTARAN[santri.statusPendaftaran] ?? PENDAFTARAN.Menunggu
  const tr = TRANSFER[santri.statusTransfer] ?? TRANSFER.Cek
  const canRevisi = !(santri.statusPendaftaran === 'Diterima' && santri.statusTransfer === 'Valid')
  const unread = user.kiasNotifications.filter((n) => !n.isRead).length
  const berkas = [
    { field: 'photo', label: 'Pas foto', ada: !!santri.photo },
    { field: 'ktp', label: 'KTP', ada: !!santri.ktp },
    { field: 'transfer', label: 'Bukti transfer', ada: !!santri.transfer },
  ]

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Ahlan wa sahlan, {user.nama}</h1>
          <p className="text-sm text-gray-500">Status pendaftaran KIAS dan informasi penting untuk Anda.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/kias/biodata" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <UserPen className="h-4 w-4" /> Biodata
          </Link>
          {santri.statusPendaftaran === 'Diterima' && (
            <Link href={`/kias/formulir/${santri.kodeRegistrasi}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <Printer className="h-4 w-4" /> Cetak Formulir F2
            </Link>
          )}
        </div>
      </div>

      {linkGroup && (
        <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">Segera bergabung ke grup</p>
            <p className="text-sm text-emerald-50">Pembayaran Anda sudah dikonfirmasi. Informasi selanjutnya ada di grup.</p>
          </div>
          <a href={linkGroup} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-700">
            <MessageCircle className="h-4 w-4" /> Bergabung Grup
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-sm text-gray-500"><st.icon className="h-4 w-4" /> Status Pendaftaran</p>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${st.cls}`}>{st.label}</span>
          <p className="mt-3 text-sm text-gray-600">No. Peserta: <strong className="font-mono">{santri.kodeRegistrasi}</strong></p>
          {santri.statusPendaftaran === 'Ditolak' && santri.alasanPenolakan && (
            <p className="mt-2 text-sm text-red-600">Alasan: {santri.alasanPenolakan}</p>
          )}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-sm text-gray-500"><BookOpenText className="h-4 w-4" /> Program</p>
          <p className="font-semibold text-gray-900">{santri.program?.namaProgram ?? '-'}</p>
          <p className="text-sm text-gray-500">{santri.program?.jenisProgram.namaJenis} · {santri.tahunPsb}</p>
          {santri.program && (
            <p className="mt-2 text-xs text-gray-500">
              {santri.program.hariBelajar} {santri.program.waktuBelajar} · {santri.program.tempatBelajar}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-sm text-gray-500"><Wallet className="h-4 w-4" /> Status Pembayaran</p>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tr.cls}`}>{tr.label}</span>
          <p className="mt-3 text-sm text-gray-600">Nominal: <strong>{formatRupiah(santri.nominalTransfer || info?.biayaPendaftaran || 0)}</strong></p>
          {santri.statusTransfer === 'Invalid' && santri.alasanPenolakan && (
            <p className="mt-2 text-sm text-red-600">Catatan: {santri.alasanPenolakan}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900"><FileImage className="h-5 w-5 text-brand-primary" /> Berkas</h2>
          <ul className="mb-5 space-y-2 text-sm">
            {berkas.map((b) => (
              <li key={b.field} className="flex items-center justify-between rounded-lg bg-brand-surface px-3 py-2">
                <span>{b.label}</span>
                {b.ada ? (
                  <a href={`/api/kias/berkas/${santri.kodeRegistrasi}/${b.field}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">Lihat</a>
                ) : (
                  <span className="text-gray-400">Belum ada</span>
                )}
              </li>
            ))}
          </ul>
          {canRevisi ? (
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm text-gray-600">
                {santri.statusTransfer === 'Invalid'
                  ? 'Bukti pembayaran Anda dinyatakan tidak valid. Silakan unggah ulang.'
                  : 'Perlu mengganti berkas? Unggah file baru di bawah (JPG/PNG, maks 2 MB).'}
              </p>
              <RevisiBerkasForm />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Pendaftaran dan pembayaran sudah diterima — berkas tidak dapat diubah.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-gray-900">
              <Bell className="h-5 w-5 text-brand-primary" /> Notifikasi
              {unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread} baru</span>}
            </h2>
            {unread > 0 && <MarkAllReadButton />}
          </div>
          {user.kiasNotifications.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada notifikasi.</p>
          ) : (
            <ul className="space-y-3">
              {user.kiasNotifications.map((n) => (
                <li key={n.id} className={`rounded-lg border p-3 text-sm ${n.isRead ? 'border-gray-100' : 'border-brand-secondary/40 bg-brand-surface'}`}>
                  <p className="font-semibold text-gray-900">{n.title}</p>
                  <p className="text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{n.createdAt.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
