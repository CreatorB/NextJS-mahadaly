import prisma from '@/lib/prisma'

/**
 * Agregasi data untuk dashboard admin Ma'had Aly.
 *
 * Semua query di sini read-only. Data dikelompokkan per area sistem:
 * HKI/PSB, KIAS, Karyawan & Absensi, Event & Konten.
 *
 * Catatan: dashboard harus tetap tampil rapi kalau sebagian data kosong
 * (mis. tabel absensi belum dipakai) — karena itu setiap bagian punya
 * nilai default, bukan `undefined`.
 */

const DAY = 86_400_000

export type Periode = 30 | 90 | 365

export const PERIODE_LIST: Periode[] = [30, 90, 365]

export const PERIODE_LABEL: Record<Periode, string> = {
  30: '30 hari',
  90: '90 hari',
  365: '12 bulan',
}

export type Namelabel = { label: string; value: number; color?: string }

function toBulan(d: Date): string {
  const bln = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ]
  return `${bln[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

/** Deret bulan (nama singkat) untuk sumbu X tren. */
function bulanTerakhir(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(toBulan(d))
  }
  return out
}

/** Agregasi tren bulanan dari daftar tanggal pembuatan. */
function trenBulatan(dates: Date[], jumlahBulan: number): { labels: string[]; values: number[] } {
  const labels = bulanTerakhir(jumlahBulan)
  const nilai = new Array(jumlahBulan).fill(0) as number[]
  const indeks = new Map(labels.map((l, i) => [l, i]))

  for (const d of dates) {
    const i = indeks.get(toBulan(d))
    if (i !== undefined) nilai[i] += 1
  }
  return { labels, values: nilai }
}

/** Hitung frekuensi nilai -> daftar label + jumlah (urutan menurun). */
function hitung(values: string[], labels: Record<string, string> = {}): Namelabel[] {
  const m = new Map<string, number>()
  for (const v of values) {
    const k = v || '(kosong)'
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()]
    .map(([k, n]) => ({ label: labels[k] ?? k, value: n }))
    .sort((a, b) => b.value - a.value)
}

/** Normalisasi nilai jenis kelamin dari berbagai penulisan di DB. */
function kodeJk(v: string | null | undefined): string {
  const s = (v ?? '').trim().toLowerCase()
  if (['l', 'lk', 'laki', 'laki-laki', 'lakilaki', 'm'].includes(s)) return 'L'
  if (['p', 'pr', 'perempuan', 'wanita', 'f'].includes(s)) return 'P'
  return v || '(kosong)'
}

/** Batasi jumlah baris grafik; sisanya digabung ke "Lainnya". */
function potongTop(values: Namelabel[], maks: number): Namelabel[] {
  if (values.length <= maks) return values
  const atas = values.slice(0, maks)
  const sisa = values.slice(maks).reduce((s, x) => s + x.value, 0)
  return [...atas, { label: 'Lainnya', value: sisa }]
}

function fmtTgl(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/* HKI / PSB                                                           */
/* ------------------------------------------------------------------ */

export type DataHki = {
  total: number
  statusPendaftaran: Namelabel[]
  statusTransfer: Namelabel[]
  perProgram: Namelabel[]
  perProvinsi: Namelabel[]
  perJk: Namelabel[]
  perPendidikan: Namelabel[]
  perTahunPsb: Namelabel[]
  tren: { labels: string[]; values: number[] }
  perluVerifikasi: { id: number; nama: string; kode: string; program: string; tanggal: string }[]
  perluTransfer: { id: number; nama: string; kode: string; program: string; nominal: number }[]
  terbaru: { id: number; nama: string; kode: string; program: string; status: string; tanggal: string }[]
  totalTransfer: number
  lunas: number
  belumLunas: number
  kanal: { label: string; dipakai: number; kuota: number | null }[]
  kuotaPsb: {
    tahun: string
    ikhwan: number
    akhwat: number
    terpakaiIkhwan: number
    terpakaiAkhwat: number
  }[]
  tahunAktif: string | null
}

async function ambilHki(): Promise<DataHki> {
  const [total, programList, daftarProvinsi, pendaftar] = await Promise.all([
    prisma.santri.count(),
    prisma.program.findMany({ select: { id: true, namaProgram: true } }),
    prisma.provinsi.findMany({ select: { id: true, nama: true } }),
    prisma.santri.findMany({
      select: {
        id: true,
        nama: true,
        kodeRegistrasi: true,
        jk: true,
        pendidikan: true,
        tahunPsb: true,
        programId: true,
        provinsiId: true,
        statusPendaftaran: true,
        statusTransfer: true,
        nominalTransfer: true,
        kelulusan: true,
        createdAt: true,
        program: { select: { namaProgram: true } },
      },
    }),
  ])

  const namaProgram = new Map(programList.map((p) => [p.id, p.namaProgram]))
  const namaProvinsi = new Map(daftarProvinsi.map((p) => [p.id, p.nama]))

  const statusPendaftaran = hitung(
    pendaftar.map((e) => e.statusPendaftaran),
    { pending: 'Menunggu', approved: 'Diterima', rejected: 'Ditolak' },
  )
  const statusTransfer = hitung(
    pendaftar.map((e) => e.statusTransfer),
    { pending: 'Menunggu', approved: 'Diterima', rejected: 'Ditolak' },
  )
  const perJk = hitung(pendaftar.map((e) => kodeJk(e.jk)), { L: 'Laki-laki', P: 'Perempuan' })
  const perPendidikan = hitung(pendaftar.map((e) => e.pendidikan)).slice(0, 8)
  const perTahunPsb = hitung(pendaftar.map((e) => e.tahunPsb)).sort((a, b) =>
    b.label.localeCompare(a.label),
  )

  const perProgramMap = new Map<string, number>()
  const perProvinsiMap = new Map<string, number>()
  for (const e of pendaftar) {
    const kp = namaProgram.get(e.programId) ?? 'Tanpa program'
    perProgramMap.set(kp, (perProgramMap.get(kp) ?? 0) + 1)
    const kv =
      e.provinsiId != null ? (namaProvinsi.get(e.provinsiId) ?? 'Tidak diisi') : 'Tidak diisi'
    perProvinsiMap.set(kv, (perProvinsiMap.get(kv) ?? 0) + 1)
  }
  const perProgram = potongTop(
    [...perProgramMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    8,
  )
  const perProvinsi = [...perProvinsiMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const tren = trenBulatan(pendaftar.map((e) => e.createdAt), 12)

  const perluVerifikasi = pendaftar
    .filter((e) => e.statusPendaftaran === 'pending')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      nama: e.nama,
      kode: e.kodeRegistrasi,
      program: e.program?.namaProgram ?? '-',
      tanggal: fmtTgl(e.createdAt),
    }))

  const perluTransfer = pendaftar
    .filter((e) => e.statusTransfer === 'pending')
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      nama: e.nama,
      kode: e.kodeRegistrasi,
      program: e.program?.namaProgram ?? '-',
      nominal: Number(e.nominalTransfer ?? 0),
    }))

  const terbaru = [...pendaftar]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      nama: e.nama,
      kode: e.kodeRegistrasi,
      program: e.program?.namaProgram ?? '-',
      status:
        e.statusPendaftaran === 'approved'
          ? 'Diterima'
          : e.statusPendaftaran === 'rejected'
            ? 'Ditolak'
            : 'Menunggu',
      tanggal: fmtTgl(e.createdAt),
    }))

  const links = await prisma.registrationLink.findMany({
    select: { label: true, quota: true, usedCount: true, isActive: true },
    orderBy: { usedCount: 'desc' },
  })
  const kanal = links.map((l) => ({
    label: l.label,
    dipakai: l.usedCount,
    kuota: l.isActive ? l.quota : null,
  }))

  const infoPsb = await prisma.infoPsb.findMany({
    orderBy: { tahunAjaran: 'desc' },
    select: { tahunAjaran: true, quotaIkhwan: true, quotaAkhwat: true },
  })
  const kuotaPsb = infoPsb.map((i) => ({
    tahun: i.tahunAjaran,
    ikhwan: i.quotaIkhwan ?? 0,
    akhwat: i.quotaAkhwat ?? 0,
    terpakaiIkhwan: pendaftar.filter((e) => e.tahunPsb === i.tahunAjaran && kodeJk(e.jk) === 'L').length,
    terpakaiAkhwat: pendaftar.filter((e) => e.tahunPsb === i.tahunAjaran && kodeJk(e.jk) === 'P').length,
  }))

  const totalTransfer = pendaftar
    .filter((e) => e.statusTransfer === 'approved')
    .reduce((s, e) => s + Number(e.nominalTransfer ?? 0), 0)

  return {
    total,
    statusPendaftaran,
    statusTransfer,
    perProgram,
    perProvinsi,
    perJk,
    perPendidikan,
    perTahunPsb,
    tren,
    perluVerifikasi,
    perluTransfer,
    terbaru,
    totalTransfer,
    lunas: pendaftar.filter((e) => e.kelulusan === 'lulus').length,
    belumLunas: pendaftar.filter((e) => e.kelulusan !== 'lulus').length,
    kanal,
    kuotaPsb,
    tahunAktif: infoPsb[0]?.tahunAjaran ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* KIAS                                                                */
/* ------------------------------------------------------------------ */

export type DataKias = {
  total: number
  status: Namelabel[]
  statusPendaftaran: Namelabel[]
  statusTransfer: Namelabel[]
  perJk: Namelabel[]
  perJenis: Namelabel[]
  perProgram: Namelabel[]
  jkPerJenis: { jenis: string; ikhwan: number; akhwat: number }[]
  perTahunPsb: Namelabel[]
  tren: { labels: string[]; values: number[] }
  perluVerifikasi: { id: number; nama: string; kode: string; program: string; tanggal: string }[]
  perluCekTransfer: { id: number; nama: string; kode: string; program: string; nominal: number }[]
  terbaru: { id: number; nama: string; kode: string; program: string; status: string; tanggal: string }[]
  kuotaPsb: {
    tahun: string
    ikhwan: number
    akhwat: number
    terpakaiIkhwan: number
    terpakaiAkhwat: number
  }[]
  pengajarPerJenis: Namelabel[]
  programAktif: number
  programTotal: number
  tahunAktif: string | null
}

async function ambilKias(): Promise<DataKias> {
  const [total, jenisList, programList, peserta] = await Promise.all([
    prisma.kiasSantri.count(),
    prisma.kiasJenisProgram.findMany({ select: { id: true, namaJenis: true } }),
    prisma.kiasProgram.findMany({
      select: { id: true, namaProgram: true, jenisProgramId: true, statusPsb: true },
    }),
    prisma.kiasSantri.findMany({
      select: {
        id: true,
        nama: true,
        kodeRegistrasi: true,
        jk: true,
        tahunPsb: true,
        programId: true,
        status: true,
        statusPendaftaran: true,
        statusTransfer: true,
        nominalTransfer: true,
        createdAt: true,
        program: {
          select: {
            namaProgram: true,
            jenisProgramId: true,
            jenisProgram: { select: { namaJenis: true } },
          },
        },
      },
    }),
  ])

  const namaJenis = new Map(jenisList.map((j) => [j.id, j.namaJenis]))
  const programKeJenis = new Map(programList.map((p) => [p.id, p.jenisProgramId]))

  const status = hitung(peserta.map((p) => p.status), { Aktif: 'Aktif', Alumni: 'Alumni' })
  const statusPendaftaran = hitung(peserta.map((p) => p.statusPendaftaran), {
    Menunggu: 'Menunggu',
    Diterima: 'Diterima',
    Ditolak: 'Ditolak',
  })
  const statusTransfer = hitung(peserta.map((p) => p.statusTransfer), {
    Cek: 'Menunggu Cek',
    Valid: 'Valid',
    Invalid: 'Tidak Valid',
  })
  const perJk = hitung(peserta.map((p) => kodeJk(p.jk)), { L: 'Ikhwan', P: 'Akhwat' })
  const perTahunPsb = hitung(peserta.map((p) => p.tahunPsb)).sort((a, b) =>
    b.label.localeCompare(a.label),
  )

  const perProgramMap = new Map<string, number>()
  const perJenisMap = new Map<string, number>()
  for (const p of peserta) {
    const kp = p.program?.namaProgram ?? 'Tanpa program'
    perProgramMap.set(kp, (perProgramMap.get(kp) ?? 0) + 1)
    const kj = p.program?.jenisProgram?.namaJenis ?? 'Tanpa jenis'
    perJenisMap.set(kj, (perJenisMap.get(kj) ?? 0) + 1)
  }
  const perProgram = potongTop(
    [...perProgramMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    10,
  )
  const perJenis = [...perJenisMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const jkPerJenis = jenisList.map((j) => ({
    jenis: j.namaJenis,
    ikhwan: peserta.filter(
      (p) =>
        p.program &&
        p.programId != null &&
        programKeJenis.get(p.programId) === j.id &&
        kodeJk(p.jk) === 'L',
    ).length,
    akhwat: peserta.filter(
      (p) =>
        p.program &&
        p.programId != null &&
        programKeJenis.get(p.programId) === j.id &&
        kodeJk(p.jk) === 'P',
    ).length,
  }))

  const tren = trenBulatan(peserta.map((p) => p.createdAt), 12)

  const perluVerifikasi = peserta
    .filter((p) => p.statusPendaftaran === 'Menunggu')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      nama: p.nama,
      kode: p.kodeRegistrasi,
      program: p.program?.namaProgram ?? '-',
      tanggal: fmtTgl(p.createdAt),
    }))

  const perluCekTransfer = peserta
    .filter((p) => p.statusTransfer === 'Cek')
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      nama: p.nama,
      kode: p.kodeRegistrasi,
      program: p.program?.namaProgram ?? '-',
      nominal: p.nominalTransfer ?? 0,
    }))

  const terbaru = [...peserta]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      nama: p.nama,
      kode: p.kodeRegistrasi,
      program: p.program?.namaProgram ?? '-',
      status: p.statusPendaftaran === 'Diterima' ? 'Diterima' : 'Menunggu',
      tanggal: fmtTgl(p.createdAt),
    }))

  const infoPsb = await prisma.kiasInfoPsb.findMany({
    orderBy: { tahunAjaran: 'desc' },
    select: { tahunAjaran: true, quotaIkhwan: true, quotaAkhwat: true },
  })
  const kuotaPsb = infoPsb.map((i) => ({
    tahun: i.tahunAjaran,
    ikhwan: i.quotaIkhwan ?? 0,
    akhwat: i.quotaAkhwat ?? 0,
    terpakaiIkhwan: peserta.filter((p) => p.tahunPsb === i.tahunAjaran && kodeJk(p.jk) === 'L').length,
    terpakaiAkhwat: peserta.filter((p) => p.tahunPsb === i.tahunAjaran && kodeJk(p.jk) === 'P').length,
  }))

  const pengajar = await prisma.kiasPengajar.groupBy({
    by: ['jenisProgramId'],
    _count: { _all: true },
  })
  const pengajarPerJenis = pengajar
    .map((p) => ({
      label: p.jenisProgramId ? (namaJenis.get(p.jenisProgramId) ?? 'Tanpa jenis') : 'Umum',
      value: p._count._all,
    }))
    .sort((a, b) => b.value - a.value)

  return {
    total,
    status,
    statusPendaftaran,
    statusTransfer,
    perJk,
    perJenis,
    perProgram,
    jkPerJenis,
    perTahunPsb,
    tren,
    perluVerifikasi,
    perluCekTransfer,
    terbaru,
    kuotaPsb,
    pengajarPerJenis,
    programAktif: programList.filter((p) => p.statusPsb === 'Buka').length,
    programTotal: programList.length,
    tahunAktif: infoPsb[0]?.tahunAjaran ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Karyawan & absensi                                                  */
/* ------------------------------------------------------------------ */

export type DataKaryawan = {
  total: number
  aktif: number
  punyaAkun: number
  perJabatan: Namelabel[]
  perTahunBergabung: Namelabel[]
  perJenisKelamin: Namelabel[]
  rekapStatus: Namelabel[]
  perMetode: Namelabel[]
  perHari: { labels: string[]; hadir: number[]; telat: number[]; alpa: number[]; izin: number[] }
  rataMasukPerHari: { labels: string[]; values: number[] }
  pengajuanStatus: Namelabel[]
  pengajuanJenis: Namelabel[]
  perluTindak: { id: number; nama: string; jenis: string; dari: string; sampai: string }[]
  hariIni: { hadir: number; telat: number; alpa: number; izin: number; total: number }
  belumAbsen: { id: number; nama: string; jabatan: string }[]
  hariLibur: number
  shiftAktif: number
}

async function ambilKaryawan(periode: Periode): Promise<DataKaryawan> {
  const now = new Date()
  const dari = new Date(now.getTime() - periode * DAY)
  const mulaiHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const akhirHariIni = new Date(mulaiHariIni.getTime() + DAY - 1)

  const [total, pegawai, absensi, pengajuan, hariLibur, shiftAktif] = await Promise.all([
    prisma.pegawai.count(),
    prisma.pegawai.findMany({
      select: {
        id: true,
        nama: true,
        jabatan: true,
        jk: true,
        isActive: true,
        tahunBergabung: true,
        userId: true,
      },
    }),
    prisma.absensiKerja.findMany({
      where: { tanggal: { gte: dari } },
      select: { tanggal: true, jamMasuk: true, metode: true, status: true, pegawaiId: true },
    }),
    prisma.pengajuan.findMany({
      select: {
        id: true,
        jenis: true,
        status: true,
        tanggalMulai: true,
        tanggalSelesai: true,
        pegawai: { select: { nama: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hariLibur.count(),
    prisma.shift.count({ where: { isActive: true } }),
  ])

  const LABEL_STATUS: Record<string, string> = {
    hadir: 'Hadir',
    telat: 'Telat',
    alpa: 'Alpa',
    izin: 'Izin',
    sakit: 'Sakit',
    cuti: 'Cuti',
  }
  const LABEL_METODE: Record<string, string> = {
    gps: 'GPS',
    wifi: 'Wi-Fi',
    manual: 'Manual',
    otomatis: 'Otomatis',
    pengajuan: 'Pengajuan',
  }

  const perJabatan = potongTop(hitung(pegawai.map((p) => p.jabatan ?? 'Tanpa jabatan')), 8)
  const perTahunBergabung = hitung(pegawai.map((p) => p.tahunBergabung ?? '-')).sort((a, b) =>
    b.label.localeCompare(a.label),
  )
  const perJenisKelamin = hitung(pegawai.map((p) => kodeJk(p.jk)), { L: 'Laki-laki', P: 'Perempuan' })
  const rekapStatus = hitung(
    absensi.map((a) => a.status),
    LABEL_STATUS,
  )
  const perMetode = hitung(absensi.map((a) => a.metode ?? 'manual'), LABEL_METODE)

  // Rekap 30 hari terakhir per hari.
  const jumlahHari = 30
  const labelsHari: string[] = []
  const hadir: number[] = []
  const telat: number[] = []
  const alpa: number[] = []
  const izin: number[] = []
  const petaHari = new Map<string, { hadir: number; telat: number; alpa: number; izin: number }>()
  for (let i = jumlahHari - 1; i >= 0; i--) {
    const d = new Date(mulaiHariIni.getTime() - i * DAY)
    petaHari.set(d.toISOString().slice(0, 10), { hadir: 0, telat: 0, alpa: 0, izin: 0 })
    labelsHari.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }))
  }
  for (const a of absensi) {
    const slot = petaHari.get(a.tanggal.toISOString().slice(0, 10))
    if (!slot) continue
    if (a.status === 'hadir') slot.hadir += 1
    else if (a.status === 'telat') slot.telat += 1
    else if (a.status === 'alpa') slot.alpa += 1
    else slot.izin += 1
  }
  for (const slot of petaHari.values()) {
    hadir.push(slot.hadir)
    telat.push(slot.telat)
    alpa.push(slot.alpa)
    izin.push(slot.izin)
  }

  // Rata-rata jam masuk (menit dari tengah malam) per hari.
  const petaMasuk = new Map<string, number[]>()
  for (const a of absensi) {
    if (!a.jamMasuk) continue
    const key = a.tanggal.toISOString().slice(0, 10)
    const menit = a.jamMasuk.getUTCHours() * 60 + a.jamMasuk.getUTCMinutes()
    const arr = petaMasuk.get(key) ?? []
    arr.push(menit)
    petaMasuk.set(key, arr)
  }
  const keysMasuk = [...petaMasuk.keys()].sort()
  const labelsMasuk = keysMasuk.map((k) =>
    new Date(k).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
  )
  const rataMasuk = keysMasuk.map((k) => {
    const arr = petaMasuk.get(k) ?? []
    return Math.round(arr.reduce((a, b) => a + b, 0) / (arr.length || 1))
  })

  const LABEL_PENGAJUAN: Record<string, string> = {
    menunggu: 'Menunggu',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
    dibatalkan: 'Dibatalkan',
  }
  const pengajuanStatus = hitung(pengajuan.map((p) => p.status), LABEL_PENGAJUAN)
  const pengajuanJenis = hitung(pengajuan.map((p) => p.jenis), {
    izin: 'Izin',
    sakit: 'Sakit',
    cuti: 'Cuti',
  })

  const perluTindak = pengajuan
    .filter((p) => p.status === 'menunggu')
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      nama: p.pegawai?.nama ?? '-',
      jenis: p.jenis,
      dari: fmtTgl(p.tanggalMulai),
      sampai: fmtTgl(p.tanggalSelesai),
    }))

  const absenHariIni = absensi.filter((a) => a.tanggal >= mulaiHariIni && a.tanggal <= akhirHariIni)
  const hariIni = {
    hadir: absenHariIni.filter((a) => a.status === 'hadir').length,
    telat: absenHariIni.filter((a) => a.status === 'telat').length,
    alpa: absenHariIni.filter((a) => a.status === 'alpa').length,
    izin: absenHariIni.filter((a) => ['izin', 'sakit', 'cuti'].includes(a.status)).length,
    total: absenHariIni.length,
  }

  const sudahAbsen = new Set(absenHariIni.map((a) => a.pegawaiId))
  const belumAbsen = pegawai
    .filter((p) => p.isActive && !sudahAbsen.has(p.id))
    .slice(0, 10)
    .map((p) => ({ id: p.id, nama: p.nama, jabatan: p.jabatan ?? '-' }))

  return {
    total,
    aktif: pegawai.filter((p) => p.isActive).length,
    punyaAkun: pegawai.filter((p) => p.userId !== null).length,
    perJabatan,
    perTahunBergabung,
    perJenisKelamin,
    rekapStatus,
    perMetode,
    perHari: { labels: labelsHari, hadir, telat, alpa, izin },
    rataMasukPerHari: { labels: labelsMasuk, values: rataMasuk },
    pengajuanStatus,
    pengajuanJenis,
    perluTindak,
    hariIni,
    belumAbsen,
    hariLibur,
    shiftAktif,
  }
}

/* ------------------------------------------------------------------ */
/* Event, berita, konten                                              */
/* ------------------------------------------------------------------ */

export type DataAcara = {
  totalEvent: number
  published: number
  mendatang: number
  perEvent: {
    id: number
    judul: string
    status: string
    mulai: string
    daftar: number
    hadir: number
    lunas: number
    persentase: number
  }[]
  perStatusEvent: Namelabel[]
  berita: { total: number; published: number; perKategori: Namelabel[] }
  instagram: { total: number; bulanTerakhir: number }
  halamanInfo: { total: number; tampil: number; perKategori: Namelabel[] }
  konten: { key: number; item: number; terisi: number }
}

async function ambilAcara(): Promise<DataAcara> {
  const now = new Date()
  const [eventList, kategori, postList, igPost, halamanInfo, nKonten, nItem, nTerisi] =
    await Promise.all([
      prisma.event.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          registrations: {
            select: { paymentStatus: true, attendances: { select: { id: true } } },
          },
        },
        orderBy: { startDate: 'desc' },
        take: 12,
      }),
      prisma.postKategori.findMany({ select: { id: true, nama: true } }),
      prisma.post.findMany({ select: { status: true, kategoriId: true } }),
      prisma.instagramPost.findMany({ select: { postedAt: true } }),
      prisma.halamanInfo.findMany({ select: { kategori: true, tampil: true } }),
      prisma.konten.count(),
      prisma.kontenItem.count(),
      prisma.konten.count({ where: { nilai: { not: '' } } }),
    ])

  const perEvent = eventList.map((e) => {
    const daftar = e.registrations.length
    const hadir = e.registrations.filter((r) => r.attendances.length > 0).length
    const lunas = e.registrations.filter((r) => r.paymentStatus === 'lunas').length
    return {
      id: e.id,
      judul: e.title,
      status:
        e.status === 'published' ? 'Terbit' : e.status === 'internal' ? 'Internal' : e.status,
      mulai: fmtTgl(e.startDate),
      daftar,
      hadir,
      lunas,
      persentase: daftar ? Math.round((hadir / daftar) * 100) : 0,
    }
  })

  const perStatusEventMap = new Map<string, number>()
  for (const e of eventList) {
    perStatusEventMap.set(e.status, (perStatusEventMap.get(e.status) ?? 0) + 1)
  }

  const namaKategori = new Map(kategori.map((k) => [k.id, k.nama]))
  const perKategoriMap = new Map<string, number>()
  for (const p of postList) {
    const k = namaKategori.get(p.kategoriId) ?? 'Tanpa kategori'
    perKategoriMap.set(k, (perKategoriMap.get(k) ?? 0) + 1)
  }

  const perKategoriInfoMap = new Map<string, number>()
  for (const h of halamanInfo) {
    perKategoriInfoMap.set(h.kategori, (perKategoriInfoMap.get(h.kategori) ?? 0) + 1)
  }

  const bulanLalu = new Date(now.getTime() - 30 * DAY)

  return {
    totalEvent: eventList.length,
    published: eventList.filter((e) => e.status === 'published').length,
    mendatang: eventList.filter((e) => e.startDate >= now).length,
    perEvent,
    perStatusEvent: [...perStatusEventMap.entries()].map(([label, value]) => ({ label, value })),
    berita: {
      total: postList.length,
      published: postList.filter((p) => p.status === 'published').length,
      perKategori: [...perKategoriMap.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
    },
    instagram: {
      total: igPost.length,
      bulanTerakhir: igPost.filter((p) => p.postedAt && p.postedAt >= bulanLalu).length,
    },
    halamanInfo: {
      total: halamanInfo.length,
      tampil: halamanInfo.filter((h) => h.tampil).length,
      perKategori: [...perKategoriInfoMap.entries()].map(([label, value]) => ({ label, value })),
    },
    konten: { key: nKonten, item: nItem, terisi: nTerisi },
  }
}

/* ------------------------------------------------------------------ */
/* Ringkasan                                                           */
/* ------------------------------------------------------------------ */

export type DataRingkasan = {
  total: number
  active: number
  pendingVerification: number
  pendingTransfer: number
  pendingVerificationKias: number
  pendingCheckKias: number
  pendingPengajuan: number
  employees: number
  employeesActive: number
  events: number
  upcomingEvents: number
  totalSantri: number
  totalKias: number
  trends: { labels: string[]; hki: number[]; kias: number[] }
  antrian: { label: string; jumlah: number; href: string }[]
}

export type DashboardData = {
  periode: Periode
  ringkasan: DataRingkasan
  hki: DataHki
  kias: DataKias
  karyawan: DataKaryawan
  acara: DataAcara
}

/** Ambil seluruh data dashboard (server component). */
export async function ambilDataDashboard(periode: Periode = 90): Promise<DashboardData> {
  const [hki, kias, karyawan, acara] = await Promise.all([
    ambilHki(),
    ambilKias(),
    ambilKaryawan(periode),
    ambilAcara(),
  ])

  const pendingVerification = hki.statusPendaftaran.find((s) => s.label === 'Menunggu')?.value ?? 0
  const pendingTransfer = hki.statusTransfer.find((s) => s.label === 'Menunggu')?.value ?? 0
  const pendingVerificationKias =
    kias.statusPendaftaran.find((s) => s.label === 'Menunggu')?.value ?? 0
  const pendingCheckKias = kias.statusTransfer.find((s) => s.label === 'Menunggu Cek')?.value ?? 0
  const pendingPengajuan =
    karyawan.pengajuanStatus.find((s) => s.label === 'Menunggu')?.value ?? 0

  const ringkasan: DataRingkasan = {
    total: hki.total,
    active: hki.statusPendaftaran.find((s) => s.label === 'Diterima')?.value ?? 0,
    pendingVerification,
    pendingTransfer,
    pendingVerificationKias,
    pendingCheckKias,
    pendingPengajuan,
    employees: karyawan.total,
    employeesActive: karyawan.aktif,
    events: acara.totalEvent,
    upcomingEvents: acara.mendatang,
    totalSantri: hki.total,
    totalKias: kias.total,
    trends: { labels: hki.tren.labels, hki: hki.tren.values, kias: kias.tren.values },
    antrian: [
      {
        label: 'Verifikasi pendaftaran HKI',
        jumlah: pendingVerification,
        href: '/admin/pendaftaran?statusPendaftaran=pending',
      },
      {
        label: 'Cek transfer HKI',
        jumlah: pendingTransfer,
        href: '/admin/pendaftaran?statusTransfer=pending',
      },
      {
        label: 'Verifikasi pendaftaran KIAS',
        jumlah: pendingVerificationKias,
        href: '/admin/kias/pendaftaran?status=Menunggu',
      },
      {
        label: 'Cek transfer KIAS',
        jumlah: pendingCheckKias,
        href: '/admin/kias/pendaftaran?transfer=Cek',
      },
      {
        label: 'Persetujuan pengajuan staf',
        jumlah: pendingPengajuan,
        href: '/admin/pengajuan',
      },
    ].filter((a) => a.jumlah > 0),
  }

  return { periode, ringkasan, hki, kias, karyawan, acara }
}
