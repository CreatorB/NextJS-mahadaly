import fs from 'fs/promises'
import path from 'path'

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? './uploads'

const IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/heic', 'image/heif',
  'image/bmp', 'image/tiff', 'image/avif',
]
const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf']

export function getUploadPath(tahunPsb: string, kode: string, field: string, ext: string): string {
  const ts = Date.now()
  const filename = `${kode}_${field}_${ts}.${ext}`
  return path.join(UPLOAD_BASE, tahunPsb, kode, filename)
}

export function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
    'image/bmp': 'bmp', 'image/tiff': 'tiff', 'image/avif': 'avif',
    'application/pdf': 'pdf',
  }
  return map[mimeType] ?? 'bin'
}

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Harus berupa gambar (JPG, PNG, WEBP, HEIC, dll.)'
  if (file.size > 1024 * 1024) return 'Ukuran maksimal 1 MB'
  return null
}

export function validateDocFile(file: File): string | null {
  if (!DOC_TYPES.includes(file.type)) return 'Harus berupa gambar atau PDF'
  if (file.size > 2 * 1024 * 1024) return 'Ukuran maksimal 2 MB'
  return null
}

export async function saveFile(file: File, tahunPsb: string, kode: string, field: string): Promise<string> {
  const ext = getExtension(file.type)
  const filePath = getUploadPath(tahunPsb, kode, field, ext)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch {
    // ignore if file doesn't exist
  }
}

export async function deleteDirectory(tahunPsb: string, kode: string): Promise<void> {
  const dir = path.join(UPLOAD_BASE, tahunPsb, kode)
  try {
    await fs.rm(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

export function getFilePath(publicUrl: string): string {
  const relative = publicUrl.replace(/^\/uploads\//, '')
  return path.join(UPLOAD_BASE, relative)
}

export function getPublicUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  // Find last '/uploads/' segment — handles both absolute paths (production)
  // and relative paths (localhost). Takes everything after that segment.
  const marker = '/uploads/'
  const idx = normalized.lastIndexOf(marker)
  if (idx !== -1) return `/uploads/${normalized.slice(idx + marker.length)}`
  // Fallback: bare 'uploads/...' with no leading slash (e.g. Windows relative)
  return `/uploads/${normalized.replace(/^\.?\/?uploads\//, '')}`
}
