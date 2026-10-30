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

  return {
    nama: String(data.nama).trim(),
    jabatan: kosong(data.jabatan),
    noHp: kosong(data.noHp) ? normalisasiHp(data.noHp) : null,
    email: kosong(data.email)?.toLowerCase() ?? null,
    nik: kosong(data.nik),
    jk: kosong(data.jk),
    tmpLahir: kosong(data.tmpLahir),
    tglLahir: data.tglLahir ?? null,
    pendidikan: kosong(data.pendidikan),
    statusPernikahan: kosong(data.statusPernikahan),
    alamat: kosong(data.alamat),
    tahunBergabung: kosong(data.tahunBergabung),
    kontakKeluarga: kosong(data.kontakKeluarga),
    fotoUrl: kosong(data.fotoUrl),
    isActive: data.isActive ?? true,
  }
}
