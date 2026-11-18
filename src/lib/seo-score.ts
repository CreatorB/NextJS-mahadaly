/**
 * Penilaian SEO artikel ala Yoast/RankMath: daftar pemeriksaan + skor 0-100.
 *
 * Modul ini murni (tanpa Prisma/fs) supaya skornya bisa dihitung identik
 * di panel admin (pratinjau langsung saat mengetik) maupun di server
 * (badge skor pada tabel daftar berita).
 */

import { slugify } from '@/lib/slug'

export type SeoCheckStatus = 'pass' | 'warn' | 'fail' | 'na'

export interface SeoCheckInput {
  judul: string
  ringkasan?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  slug: string
  konten: string
  coverAlt?: string | null
  /** Host situs (tanpa protocol) supaya tautan absolut ke domain sendiri dihitung internal. */
  baseHost?: string
}

export interface SeoCheck {
  id: string
  label: string
  status: SeoCheckStatus
  weight: number
  earned: number
  message: string
  fix: string
}

export interface SeoScoreResult {
  score: number
  grade: 'good' | 'ok' | 'bad'
  checks: SeoCheck[]
  words: number
  readingMinutes: number
}

const DIAKRITIK = /[̀-ͯ]/g

export function normalizeText(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(DIAKRITIK, '')
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function countWords(html: string) {
  const text = stripHtml(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

/** Kecepatan baca bahasa Indonesia ~200 kata/menit. */
export function readingMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 200))
}

function contains(haystack: string, needle: string) {
  if (!needle) return false
  return normalizeText(haystack).includes(normalizeText(needle))
}

function headings(html: string, tag: string) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(stripHtml(m[1]))
  return out
}

function paragraphs(html: string) {
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(stripHtml(m[1]))
  return out
}

function links(html: string) {
  const re = /<a[^>]*href=["']([^"']*)["']/gi
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(m[1].trim())
  return out
}

function images(html: string) {
  const re = /<img[^>]*>/gi
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out.push(m[0])
  return out
}

/**
 * Susun daftar pemeriksaan.
 *
 * Bobot seluruh pemeriksaan = 100. Pemeriksaan yang tidak bisa dievaluasi
 * (mis. tidak ada kata kunci fokus) berstatus 'na' dan dikeluarkan dari
 * pembagi — artikel tanpa kata kunci fokus tidak boleh terlempar skornya.
 */
export function computeSeoChecks(input: SeoCheckInput): SeoCheck[] {
  const {
    judul, ringkasan, metaTitle, metaDescription, focusKeyword,
    slug, konten, coverAlt, baseHost,
  } = input

  const keyword = (focusKeyword ?? '').trim()
  const teks = stripHtml(konten)
  const judulEfektif = (metaTitle ?? '').trim() || judul
  const deskripsiEfektif =
    (metaDescription ?? '').trim() || (ringkasan ?? '').trim() || teks.slice(0, 158)
  const words = countWords(konten)
  const h2 = headings(konten, 'h2')
  const h3 = headings(konten, 'h3')
  const paras = paragraphs(konten)
  const a = links(konten)
  const internalLinks = a.filter((href) => {
    if (href.startsWith('/')) return true
    if (!baseHost) return false
    return href.toLowerCase().includes(baseHost.toLowerCase())
  })
  const internal = internalLinks.length
  const external = a.filter((href) => href.startsWith('http') && !internalLinks.includes(href)).length
  const imgs = images(konten)
  const imgTanpaAlt = imgs.filter((tag) => !/\salt=["'][^"']+["']/i.test(tag)).length

  const cek: SeoCheck[] = []
  const tambah = (id: string, label: string, weight: number, status: SeoCheckStatus, message: string, fix: string) => {
    const earned = status === 'pass' ? weight : status === 'warn' ? Math.round(weight / 2) : 0
    cek.push({ id, label, status, weight, earned, message, fix })
  }

  // 1. Kata kunci fokus diisi
  tambah(
    'focus-keyword', 'Kata kunci fokus diisi', 8,
    keyword.length >= 2 ? 'pass' : 'fail',
    keyword.length >= 2 ? `Dipakai: "${keyword}"` : 'Belum ada kata kunci fokus',
    'Isi kata kunci fokus — itu dasar seluruh pemeriksaan di bawah.',
  )

  // 2. Kata kunci di meta title
  if (!keyword) {
    tambah('keyword-in-title', 'Kata kunci di meta title', 11, 'na', 'Selesai bila kata kunci fokus diisi', '-')
  } else if (contains(judulEfektif, keyword)) {
    tambah('keyword-in-title', 'Kata kunci di meta title', 11, 'pass', 'Ada di meta title', '-')
  } else if (contains(judul, keyword)) {
    tambah(
      'keyword-in-title', 'Kata kunci di meta title', 11, 'warn',
      'Hilang dari meta title kustom (masih ada di judul artikel)',
      'Sisipkan kata kunci ke meta title, atau kosongkan meta title agar memakai judul.',
    )
  } else {
    tambah('keyword-in-title', 'Kata kunci di meta title', 11, 'fail', 'Tidak ada di meta title', 'Sisipkan kata kunci fokus ke meta title.')
  }

  // 3. Kata kunci di meta description
  if (!keyword) {
    tambah('keyword-in-description', 'Kata kunci di meta description', 8, 'na', 'Selesai bila kata kunci fokus diisi', '-')
  } else if (contains(deskripsiEfektif, keyword)) {
    tambah('keyword-in-description', 'Kata kunci di meta description', 8, 'pass', 'Ada di meta description', '-')
  } else if (contains(ringkasan ?? '', keyword)) {
    tambah(
      'keyword-in-description', 'Kata kunci di meta description', 8, 'warn',
      'Hilang dari meta description kustom (masih ada di ringkasan)',
      'Sisipkan kata kunci ke meta description, atau kosongkan meta description.',
    )
  } else {
    tambah('keyword-in-description', 'Kata kunci di meta description', 8, 'fail', 'Tidak ada di meta description', 'Sisipkan kata kunci fokus ke meta description.')
  }

  // 4. Kata kunci di paragraf awal
  if (!keyword) {
    tambah('keyword-in-first-paragraph', 'Kata kunci di paragraf pertama', 7, 'na', 'Selesai bila kata kunci fokus diisi', '-')
  } else if (paras.length && contains(paras[0], keyword)) {
    tambah('keyword-in-first-paragraph', 'Kata kunci di paragraf pertama', 7, 'pass', 'Ada di paragraf pertama', '-')
  } else if (paras.slice(1, 3).some((p) => contains(p, keyword))) {
    tambah(
      'keyword-in-first-paragraph', 'Kata kunci di paragraf pertama', 7, 'warn',
      'Baru muncul di paragraf ke-2/3',
      'Sebut kata kunci di paragraf pembuka — ini bagian yang paling sering dibaca.',
    )
  } else {
    tambah('keyword-in-first-paragraph', 'Kata kunci di paragraf pertama', 7, 'fail', 'Tidak ada di 3 paragraf pertama', 'Sebut kata kunci fokus di paragraf pembuka.')
  }

  // 5. Kata kunci di sub-judul
  if (!keyword) {
    tambah('keyword-in-h2', 'Kata kunci di sub-judul', 6, 'na', 'Selesai bila kata kunci fokus diisi', '-')
  } else if (h2.some((h) => contains(h, keyword))) {
    tambah('keyword-in-h2', 'Kata kunci di sub-judul', 6, 'pass', 'Ada di sub-judul H2', '-')
  } else if (h3.some((h) => contains(h, keyword))) {
    tambah(
      'keyword-in-h2', 'Kata kunci di sub-judul', 6, 'warn',
      'Hanya ada di sub-judul H3',
      'Naikkan ke salah satu H2 agar struktur artikel lebih mudah dipindai mesin pencari.',
    )
  } else {
    tambah('keyword-in-h2', 'Kata kunci di sub-judul', 6, 'fail', 'Tidak ada di sub-judul', 'Pakai kata kunci fokus pada satu sub-judul H2.')
  }

  // 6. Panjang meta title
  const lenTitle = judulEfektif.length
  if (!judulEfektif) {
    tambah('meta-title-length', 'Panjang meta title', 11, 'fail', 'Meta title kosong', 'Isi judul artikel atau meta title.')
  } else if (lenTitle >= 30 && lenTitle <= 60) {
    tambah('meta-title-length', 'Panjang meta title', 11, 'pass', `${lenTitle} karakter (ideal 30-60)`, '-')
  } else if ((lenTitle >= 20 && lenTitle <= 29) || (lenTitle >= 61 && lenTitle <= 70)) {
    tambah('meta-title-length', 'Panjang meta title', 11, 'warn', `${lenTitle} karakter (ideal 30-60)`, 'Setel meta title ke 30-60 karakter agar tidak terpotong di hasil pencarian.')
  } else {
    tambah('meta-title-length', 'Panjang meta title', 11, 'fail', `${lenTitle} karakter (ideal 30-60)`, 'Ringkas meta title ke 30-60 karakter.')
  }

  // 7. Panjang meta description
  const lenDesc = deskripsiEfektif.length
  if (!deskripsiEfektif) {
    tambah('meta-description-length', 'Panjang meta description', 9, 'fail', 'Meta description kosong', 'Isi meta description atau ringkasan artikel.')
  } else if (lenDesc >= 120 && lenDesc <= 158) {
    tambah('meta-description-length', 'Panjang meta description', 9, 'pass', `${lenDesc} karakter (ideal 120-158)`, '-')
  } else if ((lenDesc >= 100 && lenDesc <= 119) || (lenDesc >= 159 && lenDesc <= 165)) {
    tambah('meta-description-length', 'Panjang meta description', 9, 'warn', `${lenDesc} karakter (ideal 120-158)`, 'Rinci meta description ke 120-158 karakter.')
  } else {
    tambah('meta-description-length', 'Panjang meta description', 9, 'fail', `${lenDesc} karakter (ideal 120-158)`, 'Tulis meta description 120-158 karakter.')
  }

  // 8. Panjang konten
  if (words >= 600) {
    tambah('content-length', 'Panjang konten', 9, 'pass', `${words} kata (minimal 600)`, '-')
  } else if (words >= 300) {
    tambah('content-length', 'Panjang konten', 9, 'warn', `${words} kata (minimal 600)`, 'Tambah pembahasan agar artikel lebih mendetail dan berbobot.')
  } else {
    tambah('content-length', 'Panjang konten', 9, 'fail', `${words} kata (minimal 600)`, 'Artikel terlalu pendek — kembangkan isinya.')
  }

  // 9. Kualitas slug
  if (!keyword) {
    tambah('slug-quality', 'Kualitas slug', 6, 'na', 'Selesai bila kata kunci fokus diisi', '-')
  } else {
    const slugLower = slug.toLowerCase()
    const intiSlug = slugify(keyword, { maxLength: 40 })
    const jumlahKata = slugLower.split('-').filter(Boolean).length
    if (!slugLower) {
      tambah('slug-quality', 'Kualitas slug', 6, 'fail', 'Slug kosong', 'Isi slug (otomatis dari judul).')
    } else if (slugLower.includes(intiSlug) && jumlahKata <= 5) {
      tambah('slug-quality', 'Kualitas slug', 6, 'pass', 'Slug ringkas dan memuat kata kunci', '-')
    } else if (slugLower.includes(intiSlug)) {
      tambah('slug-quality', 'Kualitas slug', 6, 'warn', `${jumlahKata} kata pada slug (ideal <= 5)`, 'Ringkas slug — idealnya 3-5 kata kunci utama.')
    } else {
      tambah('slug-quality', 'Kualitas slug', 6, 'fail', 'Slug tidak memuat kata kunci fokus', 'Buat slug dari judul yang memuat kata kunci fokus.')
    }
  }

  // 10. Teks alt gambar
  const altCover = (coverAlt ?? '').trim()
  if (!altCover && imgs.length === 0) {
    tambah('image-alt', 'Teks alt gambar', 5, 'fail', 'Belum ada teks alt gambar', 'Isi teks alternatif gambar sampul.')
  } else if (altCover && imgTanpaAlt === 0) {
    tambah('image-alt', 'Teks alt gambar', 5, 'pass', 'Gambar sampul & gambar isi punya teks alt', '-')
  } else if (altCover) {
    tambah('image-alt', 'Teks alt gambar', 5, 'warn', `${imgTanpaAlt} gambar isi tanpa teks alt`, 'Tambahkan teks alt pada gambar di dalam artikel.')
  } else {
    tambah('image-alt', 'Teks alt gambar', 5, 'fail', 'Gambar sampul belum ada teks alt', 'Isi teks alternatif gambar sampul.')
  }

  // 11. Tautan internal
  if (internal >= 2) {
    tambah('internal-links', 'Tautan internal', 5, 'pass', `${internal} tautan internal`, '-')
  } else if (internal === 1) {
    tambah('internal-links', 'Tautan internal', 5, 'warn', 'Hanya 1 tautan internal', 'Tambahkan tautan ke halaman/program lain di situs.')
  } else {
    tambah('internal-links', 'Tautan internal', 5, 'fail', 'Belum ada tautan internal', 'Tautkan artikel ini ke halaman lain di situs (mis. profil, program, PSB).')
  }

  // 12. Tautan eksternal
  if (external >= 1) {
    tambah('external-links', 'Tautan eksternal', 4, 'pass', `${external} tautan eksternal`, '-')
  } else {
    tambah('external-links', 'Tautan eksternal', 4, 'warn', 'Belum ada tautan eksternal', 'Sertakan sumber rujukan eksternal bila ada.')
  }

  // 13. Struktur heading
  const totalHeading = h2.length + h3.length
  if (totalHeading >= 2) {
    tambah('heading-structure', 'Struktur sub-judul', 6, 'pass', `${totalHeading} sub-judul`, '-')
  } else if (totalHeading === 1) {
    tambah('heading-structure', 'Struktur sub-judul', 6, 'warn', 'Hanya 1 sub-judul', 'Pecah isi menjadi beberapa sub-judul H2/H3.')
  } else {
    tambah('heading-structure', 'Struktur sub-judul', 6, 'fail', 'Belum ada sub-judul', 'Beri sub-judul H2 agar artikel mudah dipindai.')
  }

  // 14. Panjang judul artikel (H1)
  const lenJudul = judul.trim().length
  if (lenJudul >= 15 && lenJudul <= 70) {
    tambah('h1-length', 'Panjang judul artikel', 5, 'pass', `${lenJudul} karakter (ideal 15-70)`, '-')
  } else if ((lenJudul >= 10 && lenJudul <= 14) || (lenJudul >= 71 && lenJudul <= 90)) {
    tambah('h1-length', 'Panjang judul artikel', 5, 'warn', `${lenJudul} karakter (ideal 15-70)`, 'Rinci judul artikel ke 15-70 karakter.')
  } else {
    tambah('h1-length', 'Panjang judul artikel', 5, 'fail', `${lenJudul} karakter (ideal 15-70)`, 'Ringkas judul artikel ke 15-70 karakter.')
  }

  return cek
}

export function computeSeoScore(input: SeoCheckInput): SeoScoreResult {
  const checks = computeSeoChecks(input)
  const berlaku = checks.filter((c) => c.status !== 'na')
  const max = berlaku.reduce((n, c) => n + c.weight, 0)
  const earned = berlaku.reduce((n, c) => n + c.earned, 0)
  const score = max === 0 ? 0 : Math.max(0, Math.min(100, Math.round((earned / max) * 100)))
  const grade: SeoScoreResult['grade'] = score >= 90 ? 'good' : score >= 50 ? 'ok' : 'bad'
  const words = countWords(input.konten)
  return { score, grade, checks, words, readingMinutes: readingMinutes(words) }
}
