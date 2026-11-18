import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { UPLOAD_BASE, resolveUploadPath } from '@/lib/storage'

/**
 * Manajemen berkas upload (panel admin).
 *
 * Hanya folder yangmanaged dari panel ini:
 * - `materi`      : dokumen panduan/kalender yang diunggah admin
 * - `berita`      : gambar artikel berita
 * - `events/images`: gambar poster event
 *
 * Folder lain (termasuk berkas pendaftar yang berisi data pribadi) TIDAK
 * ditampilkan maupun bisa dihapus dari sini.
 */

export const FOLDER_DIJKELOLA = ['materi', 'berita', 'events/images'] as const

export type BerkasInfo = {
  /** Path relatif terhadap UPLOAD_BASE, mis. `materi/mahadaly-panduan.pdf`. */
  path: string
  nama: string
  folder: string
  ukuran: number
  diubah: string
  dipakai: boolean
}

export type RingkasanBerkas = {
  files: BerkasInfo[]
  totalUkuran: number
  totalSemua: number
  jumlahSemua: number
  folder: string
}

/** Apakah path relatif ini berada di folder yang boleh dikelola? */
export function bolehDikelola(relPath: string): boolean {
  const p = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
  return FOLDER_DIJKELOLA.some((f) => p === f || p.startsWith(`${f}/`))
}

/** Nama file yang dirujuk konten (materi, sampul berita, gambar di dalam isi). */
async function namaFileDipakai(): Promise<Set<string>> {
  const set = new Set<string>()

  const items = await prisma.kontenItem.findMany({ select: { fileUrl: true } })
  for (const i of items) {
    if (i.fileUrl) set.add(path.basename(i.fileUrl.split('?')[0]))
  }

  const posts = await prisma.post.findMany({ select: { coverImage: true, konten: true } })
  for (const p of posts) {
    if (p.coverImage) set.add(path.basename(p.coverImage.split('?')[0]))
    for (const m of p.konten.matchAll(/\/uploads\/[A-Za-z0-9_\-./]+/g)) {
      set.add(path.basename(m[0]))
    }
  }

  const infoPsb = await prisma.infoPsb.findMany({ select: { posterImages: true } })
  for (const i of infoPsb) {
    if (!i.posterImages) continue
    for (const m of i.posterImages.matchAll(/\/uploads\/[A-Za-z0-9_\-./]+/g)) {
      set.add(path.basename(m[0]))
    }
  }

  return set
}

async function walk(dir: string, hasil: string[] = []): Promise<string[]> {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return hasil
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full, hasil)
    } else if (e.isFile()) {
      hasil.push(full)
    }
  }
  return hasil
}

/** Daftar berkas yang boleh dikelola + ringkasan pemakaian disk. */
export async function listBerkas(): Promise<RingkasanBerkas> {
  const dipakai = await namaFileDipakai()
  const files: BerkasInfo[] = []

  for (const folder of FOLDER_DIJKELOLA) {
    const dir = path.join(UPLOAD_BASE, folder)
    const all = await walk(dir)
    for (const full of all) {
      const rel = path.relative(UPLOAD_BASE, full).replace(/\\/g, '/')
      const stat = await fs.stat(full)
      files.push({
        path: rel,
        nama: path.basename(full),
        folder,
        ukuran: stat.size,
        diubah: stat.mtime.toISOString(),
        dipakai: dipakai.has(path.basename(full)),
      })
    }
  }

  files.sort((a, b) => a.path.localeCompare(b.path))

  // Total pemakaian SELURUH folder upload (termasuk yang tidak ditampilkan).
  const semua = await walk(UPLOAD_BASE)
  let totalSemua = 0
  for (const f of semua) {
    try {
      totalSemua += (await fs.stat(f)).size
    } catch {
      /* berkas hilang di tengahCalculation */
    }
  }

  return {
    files,
    totalUkuran: files.reduce((a, f) => a + f.ukuran, 0),
    totalSemua,
    jumlahSemua: semua.length,
    folder: UPLOAD_BASE,
  }
}

export type HasilHapusBerkas = {
  terhapus: string[]
  gagal: { path: string; alasan: string }[]
}

/**
 * Hapus berkas (bulk). Berkas yang masih dirujuk konten TIDAK dihapus
 * kecuali `paksa = true`.
 */
export async function hapusBerkas(paths: string[], paksa = false): Promise<HasilHapusBerkas> {
  const hasil: HasilHapusBerkas = { terhapus: [], gagal: [] }
  if (!paths.length) return hasil

  const dipakai = paksa ? new Set<string>() : await namaFileDipakai()

  for (const rel of paths) {
    if (!bolehDikelola(rel)) {
      hasil.gagal.push({ path: rel, alasan: 'Folder tidak boleh dikelola dari panel ini' })
      continue
    }
    const full = resolveUploadPath(rel.split('/'))
    if (!full) {
      hasil.gagal.push({ path: rel, alasan: 'Path tidak valid' })
      continue
    }
    if (dipakai.has(path.basename(rel))) {
      hasil.gagal.push({ path: rel, alasan: 'Berkas masih dipakai konten' })
      continue
    }
    try {
      await fs.unlink(full)
      hasil.terhapus.push(rel)
    } catch (e) {
      hasil.gagal.push({
        path: rel,
        alasan: e instanceof Error ? e.message : 'Gagal menghapus berkas',
      })
    }
  }

  return hasil
}

/** Baca isi berkas (untuk ZIP). */
export async function bacaBerkas(rel: string): Promise<Buffer | null> {
  if (!bolehDikelola(rel)) return null
  const full = resolveUploadPath(rel.split('/'))
  if (!full) return null
  try {
    return await fs.readFile(full)
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Unggah materi (dokumen panduan / kalender)                          */
/* ------------------------------------------------------------------ */

const EKSTENSI_DIBOLEHKAN = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'])

/** Nama berkas: `mahadaly-<slug judul>-<timestamp>.<ext>`. */
export function namaBerkasMateri(judul: string, ekstensi: string, stempel = Date.now()): string {
  const slug =
    String(judul ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'dokumen'
  return `mahadaly-${slug}-${stempel}.${ekstensi}`
}

/**
 * Simpan berkas materi yang diunggah admin.
 *
 * - Nama berkas otomatis memakai prefix `mahadaly-` + slug judul.
 * - Berkas lama (yang sedang dipakai item materi) DIHAPUS supaya disk tidak
 *   menumpuk — kecuali berkas lama berada di `public/` (aset repo), yang
 *   tidak boleh dihapus saat runtime.
 *
 * Mengembalikan URL publik `/uploads/materi/<nama>`.
 */
export async function simpanBerkasMateri(
  file: File,
  judul: string,
): Promise<{ url: string; nama: string; ukuran: number }> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  if (!EKSTENSI_DIBOLEHKAN.has(ext)) {
    throw new Error('Format berkas tidak didukung. Gunakan PDF, DOC, XLS, PPT, atau ZIP.')
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Ukuran berkas maksimal 25 MB.')
  }

  const nama = namaBerkasMateri(judul, ext)
  const folder = path.join(UPLOAD_BASE, 'materi')
  await fs.mkdir(folder, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(folder, nama), buffer)

  return { url: `/uploads/materi/${nama}`, nama, ukuran: file.size }
}

/** Hapus berkas materi lama (yang diganti oleh unggahan baru). */
export async function hapusBerkasMateriLama(urlLama: string | null | undefined): Promise<boolean> {
  if (!urlLama) return false
  // Hanya berkas di UPLOAD_BASE yang boleh dihapus; aset di public/ milik repo.
  if (!urlLama.startsWith('/uploads/materi/')) return false
  const rel = urlLama.replace('/uploads/', '')
  const full = resolveUploadPath(rel.split('/'))
  if (!full) return false
  try {
    await fs.unlink(full)
    return true
  } catch {
    return false
  }
}
