/**
 * Helper data pegawai (staf).
 *
 * Password default untuk akun pegawai baru: `123456`.
 * Pegawai wajib menggantinya sendiri lewat halaman profil.
 */

import prisma from '@/lib/prisma'
import { normalisasiHp } from '@/lib/phone'

export const PASSWORD_DEFAULT_PEGAWAI = '123456'
export const ROLE_ID_PEGAWAI = 5

export interface DataPegawaiInput {
  nama: string
  kode?: string | null
  jabatan?: string | null
  noHp?: string | null
  email?: string | null
  nik?: string | null
  jk?: string | null
  tmpLahir?: string | null
  tglLahir?: Date | null
  pendidikan?: string | null
  statusPernikahan?: string | null
  alamat?: string | null
  tahunBergabung?: string | null
  kontakKeluarga?: string | null
  fotoUrl?: string | null
  ijazahUrl?: string | null
  jamMasuk?: string | null
  jamPulang?: string | null
  toleransiMenit?: number | null
  isActive?: boolean
}

/** Ambil data pegawai berdasarkan id akun `users`. */
export async function ambilPegawaiDariUserId(userId: number) {
  return prisma.pegawai.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          roleId: true,
          isActive: true,
          passwordChangedAt: true,
        },
      },
    },
  })
}

/** Normalisasi kolom sebelum disimpan (nomor HP kanonik, string kosong -> null). */
export function bersihkanDataPegawai(data: DataPegawaiInput) {
  const kosong = (v: unknown) => {
    if (v === null || v === undefined) return null
    const s = String(v).trim()
    return s.length ? s : null
  }

  const jam = (v: unknown) => {
    const s = kosong(v)
    if (!s) return null
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s)
    if (!m) return null
    const h = Number(m[1])
    const mm = Number(m[2])
    if (h > 23 || mm > 59) return null
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
  }

  const toleransi =
    data.toleransiMenit != null && Number.isFinite(Number(data.toleransiMenit))
      ? Math.max(0, Math.min(240, Math.round(Number(data.toleransiMenit))))
      : null

  return {
    kode: kosong(data.kode),
    nama: String(data.nama).trim(),
    jabatan: kosong(data.jabatan),
    noHp: kosong(data.noHp) ? normalisasiHp(data.noHp) : null,
    email: kosong(data.email)?.toLowerCase() ?? null,
    nik: kosong(data.nik),
    jk: kosong(data.jk),
    tmpLahir: kosong(data.tmpLahir),
    pendidikan: kosong(data.pendidikan),
    statusPernikahan: kosong(data.statusPernikahan),
    alamat: kosong(data.alamat),
    tahunBergabung: kosong(data.tahunBergabung),
    kontakKeluarga: kosong(data.kontakKeluarga),
    fotoUrl: kosong(data.fotoUrl),
    ijazahUrl: kosong(data.ijazahUrl),
    jamMasuk: jam(data.jamMasuk),
    jamPulang: jam(data.jamPulang),
    toleransiMenit: toleransi,
    isActive: data.isActive ?? true,
  }
}
