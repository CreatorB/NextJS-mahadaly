import fs from 'fs/promises'
import path from 'path'

/**
 * Berkas pendaftar KIAS (foto, KTP, bukti transfer) disimpan di UPLOAD_DIR/kias/{tahun}/{kode}/.
 * Folder kias/ TIDAK dilayani route publik /uploads — hanya lewat /api/kias/berkas (admin atau pemilik).
 */
import { UPLOAD_BASE } from '@/lib/storage'

export const KIAS_BERKAS_FIELDS = ['photo', 'ktp', 'transfer'] as const
export type KiasBerkasField = (typeof KIAS_BERKAS_FIELDS)[number]

const FILE_NAMES: Record<KiasBerkasField, string> = { photo: 'foto', ktp: 'ktp', transfer: 'bukti_bayar' }
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' }
export const KIAS_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' }

export function validateKiasImage(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} wajib diupload`
  if (!TYPES[file.type]) return `${label} harus berformat JPG atau PNG`
  if (file.size > 2 * 1024 * 1024) return `${label} maksimal 2 MB`
  return null
}

function kiasDir(tahunPsb: string, kode: string) {
  return path.join(UPLOAD_BASE, 'kias', tahunPsb.replace(/[^0-9A-Za-z-]/g, ''), kode.replace(/[^0-9A-Za-z-]/g, ''))
}

/** Simpan berkas, kembalikan nama file (disimpan di kolom santri, sama seperti KIAS lama: "ktp.jpg"). */
export async function saveKiasBerkas(file: File, tahunPsb: string, kode: string, field: KiasBerkasField) {
  const dir = kiasDir(tahunPsb, kode)
  await fs.mkdir(dir, { recursive: true })
  const name = `${FILE_NAMES[field]}.${TYPES[file.type]}`
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
  return name
}

export async function removeKiasDir(tahunPsb: string, kode: string) {
  await fs.rm(kiasDir(tahunPsb, kode), { recursive: true, force: true }).catch(() => undefined)
}

export function resolveKiasBerkas(tahunPsb: string, kode: string, filename: string) {
  const base = path.resolve(kiasDir(tahunPsb, kode))
  const resolved = path.resolve(base, path.basename(filename))
  return resolved.startsWith(base + path.sep) ? resolved : null
}
