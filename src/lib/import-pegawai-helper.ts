/**
 * Helper import data pegawai dari berkas Excel (.xlsx).
 *
 * Mendukung dua gaya header:
 *  1. Format Google Form ("Nama (sesuai KTP)", "No Whatsapp", "Nomor WA aktif", ...)
 *  2. Format ekspor Panel Admin ("Kode", "Nama", "Jabatan", "No WhatsApp", ...)
 *
 * Nomor WhatsApp dinormalisasi ke 08xxxxxxxxx. Bila satu nomor dipakai lebih
 * dari satu pegawai, pemegang pertama memakainya dan sisanya memakai nomor
 * cadangan (kolom lama) bila tersedia — supaya nomor tetap unik sebagai
 * identitas login. Semua bentrok dicatat untuk dilaporkan ke admin.
 */

import { cariKolom, readXlsxRows } from '@/lib/xlsx'
import { normalisasiHp } from '@/lib/phone'

const BULAN: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6, july: 7, august: 8,
}

type SumberKolom = { exact?: string[]; prefix?: string[] }

const PETA_KOLOM: Record<string, SumberKolom> = {
  kode: { exact: ['Kode', 'No', 'No. Pegawai'], prefix: ['Kode'] },
  nama: { exact: ['Nama', 'Nama Lengkap'], prefix: ['Nama (sesuai KTP)'] },
  jabatan: { exact: ['Jabatan'], prefix: ['Posisi dan Jabatan'] },
  waUtama: { exact: ['No WhatsApp', 'No WA', 'No Whatsapp'], prefix: ['No Whatsapp', 'Nomor Whatsapp'] },
  waCadangan: { exact: ['Nomor WA aktif'], prefix: ['Nomor WA'] },
  email: { exact: ['Email'], prefix: ['Email'] },
  nik: { exact: ['NIK'], prefix: ['Nomor KTP'] },
  jk: { exact: ['Jenis Kelamin'], prefix: ['Jenis Kelamin'] },
  lahir: { prefix: ['Tempat, Tanggal Lahir', 'Tempat Lahir'] },
  pendidikan: { exact: ['Pendidikan'], prefix: ['Pendidikan Terakhir'] },
  nikah: { exact: ['Status Pernikahan'], prefix: ['Status Pernikahan'] },
  alamat: { exact: ['Alamat'], prefix: ['Alamat Domisili'] },
  bergabung: { prefix: ['Tahun Bergabung'] },
  keluarga: { exact: ['Kontak Keluarga'], prefix: ['Anggota Keluarga'] },
  foto: { prefix: ['Pas Foto'] },
  ijazah: { prefix: ['Upload Ijazah'] },
  jamMasuk: { exact: ['Jam Masuk'], prefix: ['Jam Masuk'] },
  jamPulang: { exact: ['Jam Pulang'], prefix: ['Jam Pulang'] },
}

export interface IndeksKolom {
  [field: string]: number
}

export interface DataPegawaiImport {
  kode: string | null
  nama: string
  jabatan: string | null
  noHp: string | null
  email: string | null
  nik: string | null
  jk: string | null
  tmpLahir: string | null
  tglLahir: Date | null
  pendidikan: string | null
  statusPernikahan: string | null
  alamat: string | null
  tahunBergabung: string | null
  kontakKeluarga: string | null
  fotoUrl: string | null
  ijazahUrl: string | null
  jamMasuk: string | null
  jamPulang: string | null
  toleransiMenit: number | null
  isActive: boolean
}

function teks(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return null
  return s
}

/** Nomor WA dari Excel -> kanonik 08xxxxxxxxx. */
export function normalisasiHpDariExcel(v: unknown): string {
  return normalisasiHp(teks(v))
}

function jamValid(v: unknown): string | null {
  const s = teks(v)
  if (!s) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s)
  if (!m) return null
  const h = Number(m[1])
  const mm = Number(m[2])
  if (h > 23 || mm > 59) return null
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`
}

/** "Situbondo, 08/07/1994" -> tempat + tanggal. */
export function parseLahir(v: unknown): { tempat: string | null; tgl: Date | null } {
  const s = teks(v)
  if (!s) return { tempat: null, tgl: null }

  let tempat: string | null = null
  let sisa = s
  if (s.includes(',')) {
    const bagian = s.split(',', 1 + 1)
    tempat = bagian[0].trim() || null
    sisa = (bagian[1] ?? '').trim()
  }

  let m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(sisa)
  if (m) {
    const d = Number(m[1])
    const mo = Number(m[2])
    const y = Number(m[3])
    const tgl = new Date(Date.UTC(y, mo - 1, d))
    return { tempat, tgl: Number.isNaN(tgl.getTime()) ? null : tgl }
  }

  m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(sisa)
  if (m) {
    const d = Number(m[1])
    const mo = BULAN[m[2].toLowerCase()]
    const y = Number(m[3])
    if (mo) {
      const tgl = new Date(Date.UTC(y, mo - 1, d))
      return { tempat, tgl: Number.isNaN(tgl.getTime()) ? null : tgl }
    }
  }

  return { tempat, tgl: null }
}

/**
 * Baca XLSX -> baris + header + indeks kolom.
 * Baris judul kolom dicari otomatis (baris yang memuat "nama").
 */
export function bacaXlsx(buffer: Buffer): {
  baris: string[][]
  header: string[] | null
  indeks: IndeksKolom
} {
  const baris = readXlsxRows(buffer)
  const indeks: IndeksKolom = {}

  let headerIdx = -1
  for (let i = 0; i < Math.min(baris.length, 15); i++) {
    const c = cariKolom(baris[i] ?? [], 'Nama (sesuai KTP)', 'Nama Lengkap', 'Nama')
    if (c >= 0) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) return { baris, header: null, indeks }

  const header = (baris[headerIdx] ?? []).map((h) => (h ?? '').trim())

  for (const [field, sumber] of Object.entries(PETA_KOLOM)) {
    let idx = -1
    for (const want of sumber.exact ?? []) {
      idx = header.findIndex((h) => h.toLowerCase() === want.toLowerCase())
      if (idx >= 0) break
    }
    if (idx < 0) {
      for (const want of sumber.prefix ?? []) {
        idx = cariKolom(header, want)
        if (idx >= 0) break
      }
    }
    indeks[field] = idx
  }

  return { baris: baris.slice(headerIdx + 1), header, indeks }
}

/**
 * Bangun data pegawai dari baris XLSX + resolusi nomor WA bentrok.
 */
export function susunDataPegawai(
  baris: string[][],
  header: string[] | null,
  indeks: IndeksKolom,
): { data: DataPegawaiImport[]; catatan: string[] } {
  const catatan: string[] = []
  if (!header) return { data: [], catatan }

  const ambil = (row: string[], field: string) => {
    const i = indeks[field]
    if (i < 0 || i >= row.length) return null
    return row[i]
  }

  const mentah: Array<
    DataPegawaiImport & { noHpCadangan: string; noHpMentah: string | null }
  > = []

  for (const row of baris) {
    const nama = teks(ambil(row, 'nama'))
    if (!nama) continue

    const lahir = parseLahir(ambil(row, 'lahir'))
    const waUtama = normalisasiHpDariExcel(ambil(row, 'waUtama'))
    const waCadangan = normalisasiHpDariExcel(ambil(row, 'waCadangan'))

    const toleransiRaw = ambil(row, 'jamMasuk')
    void toleransiRaw

    mentah.push({
      kode: teks(ambil(row, 'kode')),
      nama,
      jabatan: teks(ambil(row, 'jabatan')),
      noHp: waUtama || null,
      noHpCadangan: waCadangan,
      noHpMentah: teks(ambil(row, 'waUtama')),
      email: teks(ambil(row, 'email'))?.toLowerCase() ?? null,
      nik: teks(ambil(row, 'nik')),
      jk: teks(ambil(row, 'jk')),
      tmpLahir: lahir.tempat,
      tglLahir: lahir.tgl,
      pendidikan: teks(ambil(row, 'pendidikan')),
      statusPernikahan: teks(ambil(row, 'nikah')),
      alamat: teks(ambil(row, 'alamat')),
      tahunBergabung: teks(ambil(row, 'bergabung')),
      kontakKeluarga: teks(ambil(row, 'keluarga')),
      fotoUrl: teks(ambil(row, 'foto')),
      ijazahUrl: teks(ambil(row, 'ijazah')),
      jamMasuk: jamValid(ambil(row, 'jamMasuk')),
      jamPulang: jamValid(ambil(row, 'jamPulang')),
      toleransiMenit: null,
      isActive: true,
    })
  }

  // Resolusi nomor bentrok (identik aturan di prisma/import-pegawai-xlsx.py).
  const semua: Record<string, number> = {}
  for (const d of mentah) {
    for (const no of [d.noHp, d.noHpCadangan]) {
      if (no) semua[no] = (semua[no] ?? 0) + 1
    }
  }

  const dipakai = new Set<string>()
  for (const d of mentah) {
    const no = d.noHp
    if (!no) continue
    if (dipakai.has(no)) {
      const cadangan = d.noHpCadangan
      if (cadangan && semua[cadangan] === 1 && !dipakai.has(cadangan)) {
        catatan.push(
          `${d.nama}: nomor ${no} dipakai lebih dari satu pegawai. Dipakai nomor lama ${cadangan} agar tetap unik. Mohon koreksi Excel.`,
        )
        d.noHp = cadangan
      } else {
        catatan.push(
          `${d.nama}: nomor ${no} dipakai lebih dari satu pegawai dan tidak ada nomor cadangan yang unik. Nomor dikosongkan (login pakai email). Mohon koreksi Excel.`,
        )
        d.noHp = null
      }
    }
    dipakai.add(d.noHp ?? '')
  }

  const data: DataPegawaiImport[] = mentah.map((d) => ({
    kode: d.kode,
    nama: d.nama,
    jabatan: d.jabatan,
    noHp: d.noHp,
    email: d.email,
    nik: d.nik,
    jk: d.jk,
    tmpLahir: d.tmpLahir,
    tglLahir: d.tglLahir,
    pendidikan: d.pendidikan,
    statusPernikahan: d.statusPernikahan,
    alamat: d.alamat,
    tahunBergabung: d.tahunBergabung,
    kontakKeluarga: d.kontakKeluarga,
    fotoUrl: d.fotoUrl,
    ijazahUrl: d.ijazahUrl,
    jamMasuk: d.jamMasuk,
    jamPulang: d.jamPulang,
    toleransiMenit: d.toleransiMenit,
    isActive: d.isActive,
  }))
  return { data, catatan }
}
