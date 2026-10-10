import prisma from '@/lib/prisma'

export const KIAS_DAFTAR_URL = '/kias/daftar'

/** Jenis program yang menerima pendaftaran lewat form KIAS (Ulum Asy-Syariah tidak, sama seperti situs lama). */
export const KIAS_JENIS_DAFTAR = [1, 2, 4]

export const KIAS_PENDIDIKAN = [
  'Tidak Ada', 'SD/MI', 'SMP/MTS', 'SMA/SMK/MA', 'Akademi', 'D1', 'D2', 'D3',
  'Sarjana (S1)', 'Magister (S2)', 'Doktor (S3)',
]

export const KIAS_REKENING = {
  bank: 'BSI (Bank Syariah Indonesia)',
  nomor: '756 2929 007',
  atasNama: 'Yayasan Cahaya Sunnah',
}

export function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

/** Ringkas nominal untuk tampilan harga besar: 250000 → "250rb", 3000000 → "3 jt". */
export function formatRupiahShort(n: number) {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000
    return `${jt.toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt`
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`
  return n.toLocaleString('id-ID')
}

type InfoWindow = { statusPsb: string; datetimeOpen: Date | null; datetimeClosed: Date | null }

/** Sama dengan InfoPsb::isOpen() di KIAS lama: jendela tanggal menang, kalau tidak ada pakai status_psb. */
export function isKiasPsbOpen(info: InfoWindow | null | undefined, now = new Date()) {
  if (!info) return false
  if (info.datetimeOpen && info.datetimeClosed) return info.datetimeOpen <= now && now <= info.datetimeClosed
  return info.statusPsb === 'Buka'
}

/** Sama dengan InfoPsbService::psbAktif(): yang sedang dalam jendela, lalu yang berstatus Buka, lalu yang terbaru. */
export async function getActiveKiasInfo() {
  const now = new Date()
  return (
    (await prisma.kiasInfoPsb.findFirst({
      where: { datetimeOpen: { lte: now }, datetimeClosed: { gte: now } },
      orderBy: { id: 'desc' },
    })) ??
    (await prisma.kiasInfoPsb.findFirst({ where: { statusPsb: 'Buka' }, orderBy: { id: 'desc' } })) ??
    (await prisma.kiasInfoPsb.findFirst({ orderBy: { id: 'desc' } }))
  )
}

export async function getKiasQuota(info: { tahunAjaran: string; quotaIkhwan: number | null; quotaAkhwat: number | null }) {
  const [ikhwan, akhwat] = await Promise.all([
    prisma.kiasSantri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Laki-Laki' } }),
    prisma.kiasSantri.count({ where: { tahunPsb: info.tahunAjaran, jk: 'Perempuan' } }),
  ])
  return {
    ikhwan,
    akhwat,
    sisaIkhwan: info.quotaIkhwan == null ? null : Math.max(0, info.quotaIkhwan - ikhwan),
    sisaAkhwat: info.quotaAkhwat == null ? null : Math.max(0, info.quotaAkhwat - akhwat),
  }
}

export async function getKiasJenisPrograms() {
  return prisma.kiasJenisProgram.findMany({
    orderBy: { urutan: 'asc' },
    include: { programs: { orderBy: { id: 'asc' } } },
  })
}

/** Kode registrasi format KIAS lama: yy + menit + detik + urutan pendaftar tahun itu. Dipakai juga sebagai password awal. */
export async function generateKiasKode(tahunPsb: string) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  let urutan = (await prisma.kiasSantri.count({ where: { tahunPsb } })) + 1
  for (;;) {
    const kode = `${yy}${mi}${ss}${urutan}`
    const exist = await prisma.kiasSantri.findUnique({ where: { kodeRegistrasi: kode }, select: { id: true } })
    if (!exist) return kode
    urutan++
  }
}

/** Normalisasi nomor HP seperti di form KIAS: buang awalan 0 / +62 / 62. */
export function normalizeNoHp(raw: string) {
  let n = raw.replace(/[\s\-.]/g, '')
  if (n.startsWith('+62')) n = n.slice(3)
  else if (n.startsWith('62') && n.length >= 11) n = n.slice(2)
  if (n.startsWith('0')) n = n.slice(1)
  return n
}

export function splitLines(text: string | null | undefined) {
  return (text ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
}
