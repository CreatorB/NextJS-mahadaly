import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'

export const KIAS_STATUS_PENDAFTARAN = ['Menunggu', 'Diterima', 'Ditolak'] as const
export const KIAS_STATUS_TRANSFER = ['Cek', 'Valid', 'Invalid'] as const
export const KIAS_STATUS_SANTRI = ['Aktif', 'Alumni', 'Tidak Lulus Tes', 'Mengundurkan Diri', 'DO'] as const

/** Kode VCF per jenis program (sama dengan ekspor KIAS lama). */
export const KIAS_VCF_CODE: Record<number, string> = { 1: 'Tq', 2: 'Reg', 3: 'Usy', 4: 'Tak' }

export async function requireAdminApi(req: Request) {
  const session = await verifyTokenFromRequest(req)
  return session && session.roleId <= 2 ? session : null
}

export interface KiasFilter {
  tahun?: string
  status?: string
  transfer?: string
  program?: string
  jk?: string
  q?: string
}

export function kiasFilterFromParams(sp: URLSearchParams | Record<string, string | undefined>): KiasFilter {
  const get = (k: string) => (sp instanceof URLSearchParams ? sp.get(k) : sp[k]) || undefined
  return { tahun: get('tahun'), status: get('status'), transfer: get('transfer'), program: get('program'), jk: get('jk'), q: get('q') }
}

export function kiasWhere(f: KiasFilter): Prisma.KiasSantriWhereInput {
  const where: Prisma.KiasSantriWhereInput = {}
  if (f.tahun) where.tahunPsb = f.tahun
  if (f.status) where.statusPendaftaran = f.status
  if (f.transfer) where.statusTransfer = f.transfer
  if (f.program) where.programId = Number(f.program)
  if (f.jk) where.jk = f.jk
  if (f.q) {
    where.OR = [
      { nama: { contains: f.q } },
      { kodeRegistrasi: { contains: f.q } },
      { email: { contains: f.q } },
      { hp: { contains: f.q } },
    ]
  }
  return where
}

/** Tahun ajaran default untuk halaman admin: info PSB terbaru. */
export async function defaultKiasTahun() {
  const info = await prisma.kiasInfoPsb.findFirst({ orderBy: { id: 'desc' }, select: { tahunAjaran: true } })
  return info?.tahunAjaran
}

export async function notifyKiasSantri(kiasSantriId: number, type: string, title: string, message: string) {
  const user = await prisma.user.findUnique({ where: { kiasSantriId }, select: { id: true } })
  if (!user) return
  await prisma.kiasNotification.create({ data: { userId: user.id, kiasSantriId, type, title, message } })
}

/** Tautan WhatsApp konfirmasi (teks sama dengan KIAS lama). */
export function kiasWhatsAppLink(s: { hp: string | null; nama: string; statusTransfer: string; program?: { namaProgram: string } | null }, linkGroup?: string | null) {
  const nomor = (s.hp ?? '').replace(/[^0-9]/g, '')
  const program = s.program?.namaProgram ?? '-'
  const text =
    s.statusTransfer === 'Valid'
      ? `*_KONFIRMASI PENDAFTARAN_*\n\nSelamat! Pendaftaran dengan data berikut:\n\nNama Lengkap: *${s.nama}*\nProgram: *${program}*\nStatus Transfer: *Valid*\n\ntelah berhasil. Selanjutnya silahkan tunggu proses pelaksanaan tes masuk, kami akan menghubungi anda kembali${linkGroup ? `, silahkan masuk group sesuai program yang dipilih: ${linkGroup}` : ''}\nTerima kasih, jazakumullahu khoiron.\n\n_Panitia PSB_\n_https://mahadaly.syathiby.id/kias_`
      : `*_KONFIRMASI PENDAFTARAN_*\n\nMohon maaf! Pendaftaran dengan data berikut:\n\nNama Lengkap: *${s.nama}*\nProgram: *${program}*\n\nbelum dapat kami terima dengan alasan *Bukti Transfer Tidak Valid*. Mohon untuk mengunggah ulang bukti transfer melalui dashboard, atau kirimkan melalui WhatsApp ini.\nTerima kasih, jazakumullahu khoiron.\n\n_Panitia PSB_\n_https://mahadaly.syathiby.id/kias_`
  return `https://wa.me/${nomor}?text=${encodeURIComponent(text)}`
}
