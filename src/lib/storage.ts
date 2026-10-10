import path from 'path'
import prisma from '@/lib/prisma'
import type { JWTPayload } from '@/lib/auth'

/**
 * Lokasi file upload. WAJIB di luar folder aplikasi (supaya deploy/build tidak menimpa)
 * dan di luar document root web (supaya tidak bisa diunduh langsung tanpa cek akses).
 * Contoh prod: UPLOAD_DIR=/home/syathiby/storage/mahadaly/uploads
 */
export const UPLOAD_BASE = path.resolve(process.env.UPLOAD_DIR ?? './uploads')

let warned = false
export function warnUnsafeUploadDir() {
  if (warned || process.env.NODE_ENV !== 'production') return
  warned = true
  const appDir = path.resolve(process.cwd())
  if (!process.env.UPLOAD_DIR || UPLOAD_BASE.startsWith(appDir + path.sep)) {
    console.warn(`[storage] UPLOAD_DIR (${UPLOAD_BASE}) berada di dalam folder aplikasi — bisa hilang saat deploy.`)
  }
  if (/[\\/]public_html[\\/]/.test(UPLOAD_BASE)) {
    console.warn(`[storage] UPLOAD_DIR (${UPLOAD_BASE}) berada di dalam public_html — berkas bisa diunduh langsung tanpa login.`)
  }
}

/** Gabungkan path relatif ke UPLOAD_BASE dengan aman (tolak traversal). */
export function resolveUploadPath(parts: string[]): string | null {
  if (parts.some((p) => !p || p === '.' || p === '..' || p.includes('\0'))) return null
  const resolved = path.resolve(UPLOAD_BASE, ...parts)
  return resolved.startsWith(UPLOAD_BASE + path.sep) ? resolved : null
}

export const UPLOAD_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  pdf: 'application/pdf',
}

/** Folder yang boleh diakses publik: gambar artikel berita dan poster event. */
export function isPublicUpload(parts: string[]) {
  return parts[0] === 'berita' || (parts[0] === 'events' && parts[1] === 'images')
}

/**
 * Berkas pendaftar HKI: {tahunPsb}/{kodeRegistrasi}/{file}.
 * Boleh dibuka admin (role 1-2) atau santri pemilik kode registrasi tsb.
 * Folder kias/ punya route sendiri (/api/kias/berkas) dan tidak dilayani di sini.
 */
export async function canAccessUpload(session: JWTPayload | null, parts: string[]) {
  if (isPublicUpload(parts)) return true
  if (!session) return false
  if (parts[0] === 'kias' || parts[0] === 'events') return false
  if (session.roleId <= 2) return true
  if (parts.length < 3) return false
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { siswa: { select: { kodeRegistrasi: true } } },
  })
  return !!user?.siswa && user.siswa.kodeRegistrasi === parts[1]
}
