/**
 * Jejak audit perubahan data absensi.
 *
 * Semua aksi admin (ubah status, buat catatan manual, hapus, setujui/tolak
 * pengajuan, ubah jadwal shift, ubah pengaturan) dicatat di tabel
 * `riwayat_absensi` supaya bisa ditelusuri kembali.
 */

import prisma from '@/lib/prisma'

export interface CatatRiwayat {
  /** Aksi, contoh: set-status | buat-catatan | hapus | setujui | tolak | jadwal | pengaturan */
  aksi: string
  /** Entitas yang diubah: absensi | pengajuan | pegawai | pengaturan | jadwal */
  entitas: string
  entitasId?: number | null
  pegawaiId?: number | null
  /** Nilai sebelum perubahan (objek apa pun yang bisa di-JSON-kan). */
  sebelum?: unknown
  /** Nilai sesudah perubahan. */
  sesudah?: unknown
  keterangan?: string | null
  actorId?: number | null
  actorNama?: string | null
}

function json(v: unknown): string | null {
  if (v === null || v === undefined) return null
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/** Simpan jejak audit. Gagal menyimpan tidak boleh menggagalkan aksi utama. */
export async function catatRiwayat(data: CatatRiwayat): Promise<void> {
  try {
    await prisma.riwayatAbsensi.create({
      data: {
        aksi: data.aksi,
        entitas: data.entitas,
        entitasId: data.entitasId ?? null,
        pegawaiId: data.pegawaiId ?? null,
        sebelum: json(data.sebelum),
        sesudah: json(data.sesudah),
        keterangan: data.keterangan ?? null,
        actorId: data.actorId ?? null,
        actorNama: data.actorNama ?? null,
      },
    })
  } catch (e) {
    console.error('Gagal menyimpan riwayat absensi:', e)
  }
}

/** Parse kolom JSON (sebelum/sesudah) untuk ditampilkan di panel admin. */
export function bukaJson(v: string | null | undefined): unknown {
  if (!v) return null
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}
