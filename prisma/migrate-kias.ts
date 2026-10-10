/**
 * Migrasi data KIAS (kias.syathiby.id, DB Laravel `syathiby_kias`) ke tabel `kias_*`
 * di DB Mahadaly. Idempotent (upsert by id), aman dijalankan ulang.
 *
 * Pemakaian:
 *   KIAS_SOURCE_URL="mysql://USER:PASS@HOST:3306/syathiby_kias" \
 *   DATABASE_URL="mysql://USER:PASS@HOST:3306/syathiby_mahadaly" \
 *   npx tsx prisma/migrate-kias.ts [catalog|santri|all]   (default: catalog)
 *
 * Sumber hanya dibaca (SELECT), tidak pernah ditulis.
 */
import 'dotenv/config'
import * as mariadb from 'mariadb'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'

const sourceUrl = process.env.KIAS_SOURCE_URL
if (!sourceUrl) {
  console.error('KIAS_SOURCE_URL wajib diisi (DB syathiby_kias sumber).')
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })

// Konten halaman program dari kias.syathiby.id (/program-*), disimpan per jenis program.
const JENIS_CONTENT: Record<number, {
  slug: string
  urutan: number
  tagline: string
  muqoddimah: string
  kompetensi: string
  peserta: string
}> = {
  1: {
    slug: 'tajwid-quran',
    urutan: 1,
    tagline: "Program untuk Anda yang ingin bisa membaca dan menulis Al-Qur'an",
    muqoddimah:
      "Membaca Al-Qur'an harus sesuai dengan yang diperintahkan Allah dan dicontohkan oleh Rasul-Nya. Al-Imam Ibnul Jazari rahimahullah mengatakan: \"Membaca Al-Qur'an dengan tajwid hukumnya wajib.\" Maka ilmu tajwid sangat penting dipelajari, dan cara terbaik adalah dengan berguru kepada ahlinya.",
    kompetensi: [
      "Mampu membaca dan menulis Al-Qur'an dengan baik dan benar",
      'Memiliki dasar-dasar Ilmu Tajwid',
      'Mengenal nilai-nilai Islam serta mampu mempraktekannya dalam kehidupan',
      'Memiliki akhlak yang mulia',
    ].join('\n'),
    peserta: [
      "Ikhwan dan akhwat yang belum bisa baca dan tulis Al-Qur'an",
      "Ikhwan dan akhwat yang sudah bisa baca tulis Al-Qur'an namun ingin mempelajari ilmu Tajwid",
    ].join('\n'),
  },
  2: {
    slug: 'bahasa-arab',
    urutan: 2,
    tagline: 'Belajar bahasa Arab intensif dengan fokus pada keahlian membaca dan mendengar',
    muqoddimah:
      "Allah menurunkan Al-Qur'an dengan bahasa Arab dan mengutus Nabi Muhammad shallallahu 'alaihi wa sallam dengan bahasa Arab. Tidak mungkin memahami dinul Islam dengan pemahaman yang benar kecuali dengan bahasa Arab.",
    kompetensi: [
      'Menguasai 4 keterampilan bahasa (mendengar, membaca, berbicara, menulis) sesuai kurikulum',
      'Menekankan kemampuan membaca dan mendengar',
      'Dibekali pengetahuan Aqidah, Manhaj dan Fiqih',
      "Siap mengikuti jenjang berikutnya (takhassus ilmu syar'i)",
    ].join('\n'),
    peserta: "Ikhwan dan akhwat yang mampu membaca Al-Qur'an dengan lancar atau lulusan Program KIAS Tajwid Al-Qur'an",
  },
  3: {
    slug: 'ulum-syariah',
    urutan: 4,
    tagline: "Program bagi Anda yang sudah lancar berbahasa Arab dan ingin belajar berbagai disiplin ilmu syar'i",
    muqoddimah:
      "Ilmu syar'i adalah ilmu yang membimbing kepada kemuliaan dan kesempurnaan dalam beribadah. \"Barangsiapa yang Allah kehendaki kebaikan pada dirinya, niscaya Dia akan membuatnya faham tentang urusan agama.\"",
    kompetensi: [
      'Mampu membaca kitab para ulama yang berbahasa Arab',
      "Memiliki dasar-dasar Ulum Asy-Syari'ah dan Ulum Al-Hadits",
      'Mengetahui sumber rujukan kitab secara ilmiah',
      'Mengetahui dasar-dasar pengambilan hukum yang shahih',
      'Mampu mengamalkan dan mendakwahkan ilmu dengan shahih',
      'Memiliki akhlak yang mulia',
    ].join('\n'),
    peserta: 'Memiliki kemampuan bahasa Arab dasar (aktif maupun pasif) yang memadai, karena KBM menggunakan bahasa Arab',
  },
  4: {
    slug: 'takmili',
    urutan: 3,
    tagline: 'Program lanjutan untuk penyempurnaan bagi Anda yang sudah bisa bahasa Arab',
    muqoddimah:
      'Kelanjutan dari program Bahasa Arab untuk menyempurnakan keterampilan berbahasa Arab sebagai bekal memahami Al-Qur\'an, As-Sunnah dan kitab para ulama.',
    kompetensi: [
      'Menguasai 4 keterampilan bahasa (mendengar, membaca, berbicara, menulis) sesuai kurikulum',
      'Menekankan kemampuan membaca dan mendengar',
      'Dibekali pengetahuan Aqidah, Manhaj dan Fiqih',
    ].join('\n'),
    peserta: "Ikhwan dan akhwat yang sudah memiliki kemampuan dasar bahasa Arab dan lancar membaca Al-Qur'an, atau lulusan program Bahasa Arab KIAS",
  },
}

type Row = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? null : String(v))
const int = (v: unknown) => (v === null || v === undefined ? null : Number(v))

async function migrateCatalog(src: mariadb.Connection) {
  const jenis: Row[] = await src.query('SELECT * FROM jenis_program ORDER BY id')
  for (const j of jenis) {
    const id = Number(j.id)
    const content = JENIS_CONTENT[id] ?? {
      slug: `jenis-${id}`, urutan: id, tagline: '', muqoddimah: '', kompetensi: '', peserta: '',
    }
    const data = { namaJenis: String(j.nama_jenis), roisQism: str(j.rois_qism), ...content }
    await prisma.kiasJenisProgram.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_jenis_program: ${jenis.length}`)

  const programs: Row[] = await src.query('SELECT * FROM program ORDER BY id')
  for (const p of programs) {
    const id = Number(p.id)
    const data = {
      namaProgram: String(p.nama_program),
      jenisProgramId: Number(p.jenis_program_id),
      tempatBelajar: str(p.tempat_belajar),
      hariBelajar: str(p.hari_belajar),
      waktuBelajar: str(p.waktu_belajar),
      durasiBelajar: int(p.durasi_belajar),
      persyaratan: str(p.persyaratan),
      statusPsb: str(p.status_psb) ?? 'Tutup',
      warna: str(p.warna),
    }
    await prisma.kiasProgram.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_program: ${programs.length}`)

  const kitab: Row[] = await src.query('SELECT * FROM kitab ORDER BY id')
  for (const k of kitab) {
    const id = Number(k.id)
    const data = {
      jenisProgramId: Number(k.jenis_program_id),
      namaKitab: String(k.nama_kitab ?? ''),
      penulis: str(k.penulis),
      kelas: int(k.kelas),
    }
    await prisma.kiasKitab.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_kitab: ${kitab.length}`)

  const pengajar: Row[] = await src.query('SELECT * FROM pengajar ORDER BY id')
  for (const g of pengajar) {
    const id = Number(g.id)
    const data = {
      nama: String(g.nama ?? ''),
      jk: str(g.jk),
      posisi: str(g.posisi),
      jenisProgramId: int(g.jenis_program_id),
    }
    await prisma.kiasPengajar.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_pengajar: ${pengajar.length}`)

  const cabang: Row[] = await src.query('SELECT * FROM cabang ORDER BY id')
  for (const c of cabang) {
    const id = Number(c.id)
    const data = { nama: String(c.nama ?? ''), alamat: str(c.alamat), noHp: str(c.no_hp) }
    await prisma.kiasCabang.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_cabang: ${cabang.length}`)

  const info: Row[] = await src.query('SELECT * FROM info_psb ORDER BY id')
  for (const i of info) {
    const id = Number(i.id)
    const posters = i.poster_images
    const data = {
      tahunAjaran: String(i.tahun_ajaran),
      statusPsb: str(i.status_psb) ?? 'Tutup',
      datetimeOpen: asDate(i.datetime_open),
      datetimeClosed: asDate(i.datetime_closed),
      akhirPsb: asDate(i.akhir_psb),
      quotaIkhwan: int(i.quota_ikhwan),
      quotaAkhwat: int(i.quota_akhwat),
      biayaPendaftaran: int(i.biaya_pendaftaran) ?? 0,
      biayaSaranaPrasarana: int(i.biaya_sarana_prasana) ?? 0,
      biayaKuliahPerdana: int(i.biaya_kuliah_perdana) ?? 0,
      biayaSppBulanan: int(i.biaya_spp_bulanan) ?? int(i.biaya_spp) ?? 0,
      biayaMutasi: int(i.biaya_mutasi),
      biayaTranskrip: int(i.biaya_transkrip),
      kontenPsb: str(i.konten_psb),
      posterImages: posters === null || posters === undefined
        ? null
        : typeof posters === 'string' ? posters : JSON.stringify(posters),
      linkGroup: str(i.link_group),
      manualPassword: str(i.manual_password),
    }
    await prisma.kiasInfoPsb.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_info_psb: ${info.length}`)

  const pekerjaan: Row[] = await src.query('SELECT * FROM pekerjaan ORDER BY id')
  for (const k of pekerjaan) {
    const id = Number(k.id)
    const nama = String(k.nama_pekerjaan ?? '').trim()
    if (!nama) continue
    await prisma.kiasPekerjaan.upsert({ where: { id }, update: { nama }, create: { id, nama } })
  }
  console.log(`✓ kias_pekerjaan: ${pekerjaan.length}`)
}

/** Sama dengan normalizeNoHp di src/lib/kias.ts: simpan tanpa awalan 0 / 62 / +62. */
function normalizeNoHp(v: string | null) {
  if (!v) return null
  let n = v.replace(/[\s\-.]/g, '')
  if (n.startsWith('+62')) n = n.slice(3)
  else if (n.startsWith('62') && n.length >= 11) n = n.slice(2)
  if (n.startsWith('0')) n = n.slice(1)
  return n || null
}

/** Tahun PSB kosong di data lama KIAS. */
const TAHUN_KOSONG = '-'
/**
 * Koneksi sumber memakai dateStrings, jadi tanggal datang sebagai teks apa adanya dari MySQL KIAS.
 * DATE ("2007-01-05") → tanggal murni (UTC tengah malam, tidak bergeser hari).
 * DATETIME/TIMESTAMP ("2026-08-18 08:48:11") → WIB, karena Laravel KIAS memakai timezone Asia/Jakarta.
 */
function asDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v !== 'string' || !v || v.startsWith('0000')) return null
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : new Date(`${v.replace(' ', 'T')}+07:00`)
  return isNaN(d.getTime()) ? null : d
}

async function migrateSantri(src: mariadb.Connection) {
  const rows: Row[] = await src.query('SELECT * FROM santri ORDER BY id')
  const programIds = new Set((await prisma.kiasProgram.findMany({ select: { id: true } })).map((p) => p.id))
  for (const s of rows) {
    const id = Number(s.id)
    const programId = int(s.program_id)
    const data = {
      kodeRegistrasi: String(s.kode_registrasi),
      nama: String(s.nama ?? '').trim() || '(tanpa nama)',
      jk: str(s.jk) ?? '',
      nik: str(s.nik),
      nisn: str(s.nisn),
      noInduk: str(s.no_induk),
      tmpLahir: str(s.tmp_lahir),
      tglLahir: asDate(s.tgl_lahir),
      alamat: str(s.alamat),
      namaAyah: str(s.nama_ayah),
      noHpAyah: str(s.no_hp_ayah),
      namaIbu: str(s.nama_ibu),
      noHpIbu: str(s.no_hp_ibu),
      namaWali: str(s.nama_wali),
      noHpWali: str(s.no_hp_wali),
      pendidikan: str(s.pendidikan),
      pekerjaan: str(s.pekerjaan),
      email: str(s.email),
      kodeNegara: str(s.kode_negara) ?? '62',
      noHp: normalizeNoHp(str(s.no_hp)),
      hp: str(s.hp),
      tahunPsb: str(s.tahun_psb) ?? TAHUN_KOSONG,
      programId: programId !== null && programIds.has(programId) ? programId : null,
      status: str(s.status) ?? 'Aktif',
      photo: str(s.photo),
      ktp: str(s.ktp),
      transfer: str(s.transfer),
      statusPendaftaran: str(s.status_pendaftaran) ?? 'Menunggu',
      alasanPenolakan: str(s.alasan_penolakan),
      tglVerifikasi: asDate(s.tgl_verifikasi),
      statusTransfer: str(s.status_transfer) ?? 'Cek',
      nominalTransfer: int(s.nominal_transfer) ?? 0,
      kirimNotifikasi: Number(s.kirim_notifikasi) === 1,
      createdAt: asDate(s.created_at) ?? asDate(s.updated_at) ?? new Date(0),
    }
    await prisma.kiasSantri.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ kias_santri: ${rows.length}`)
}

/**
 * Akun KIAS → users Mahadaly. Hash bcrypt `$2y$` Laravel kompatibel dengan bcryptjs, jadi password lama tetap berlaku.
 * - Email yang sudah ada di Mahadaly: akun itu ditautkan ke santri KIAS (tidak diduplikasi, password Mahadaly tetap).
 * - Admin/superadmin KIAS → admin Mahadaly (role 2). Login non-email → `<login>@kias.local`.
 * - Peserta event (role 4) → role 4 `peserta`.
 * Mengembalikan peta id user KIAS → id user Mahadaly.
 */
async function migrateUsers(src: mariadb.Connection) {
  await prisma.role.upsert({ where: { namaRole: 'peserta' }, update: {}, create: { id: 4, namaRole: 'peserta' } })
  const rows: Row[] = await src.query('SELECT * FROM users ORDER BY id')
  const map = new Map<number, number>()
  const report = { baru: 0, ditautkan: 0, adminLewati: 0 }

  for (const u of rows) {
    const kiasId = Number(u.id)
    const rawEmail = String(u.email ?? '').trim().toLowerCase()
    const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@kias.local`
    const kiasRole = Number(u.role_id)
    const roleId = kiasRole <= 2 ? 2 : kiasRole === 4 ? 4 : 3
    const santriId = int(u.santri_id)
    const kiasSantriId = santriId !== null && (await prisma.kiasSantri.findUnique({ where: { id: santriId }, select: { id: true } }))
      ? santriId
      : null

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      map.set(kiasId, existing.id)
      if (kiasSantriId && !existing.kiasSantriId) {
        const taken = await prisma.user.findUnique({ where: { kiasSantriId }, select: { id: true } })
        if (!taken) await prisma.user.update({ where: { id: existing.id }, data: { kiasSantriId } })
      }
      if (existing.roleId <= 2 && roleId > 2) report.adminLewati++
      else report.ditautkan++
      continue
    }
    const taken = kiasSantriId ? await prisma.user.findUnique({ where: { kiasSantriId }, select: { id: true } }) : null
    const created = await prisma.user.create({
      data: {
        nama: String(u.nama ?? '').trim() || email,
        email,
        password: String(u.password),
        roleId,
        isActive: u.banned_at == null,
        kiasSantriId: taken ? null : kiasSantriId,
        createdAt: asDate(u.created_at) ?? new Date(),
      },
    })
    map.set(kiasId, created.id)
    report.baru++
  }
  console.log(`✓ users: ${rows.length} akun KIAS (baru ${report.baru}, ditautkan ke akun yang sudah ada ${report.ditautkan}, email milik admin Mahadaly ${report.adminLewati})`)
  return map
}

async function migrateNotifications(src: mariadb.Connection, userMap: Map<number, number>) {
  const rows: Row[] = await src.query('SELECT * FROM notifications ORDER BY id')
  let n = 0
  for (const r of rows) {
    const userId = userMap.get(Number(r.user_id))
    if (!userId) continue
    const santriId = int(r.santri_id)
    const kiasSantriId = santriId !== null && (await prisma.kiasSantri.findUnique({ where: { id: santriId }, select: { id: true } })) ? santriId : null
    const id = Number(r.id)
    const data = {
      userId,
      kiasSantriId,
      type: String(r.type),
      title: String(r.title),
      message: String(r.message),
      isRead: Number(r.is_read) === 1,
      createdAt: asDate(r.created_at) ?? new Date(),
    }
    await prisma.kiasNotification.upsert({ where: { id }, update: data, create: { id, ...data } })
    n++
  }
  console.log(`✓ kias_notifications: ${n}/${rows.length}`)
}

/** Events + pendaftaran + absensi + link internal. File poster/bukti bayar dipindah terpisah (Fase 6). */
async function migrateEvents(src: mariadb.Connection, userMap: Map<number, number>) {
  const events: Row[] = await src.query('SELECT * FROM events ORDER BY id')
  for (const e of events) {
    const id = Number(e.id)
    const images = e.images ? String(e.images) : e.image ? JSON.stringify([String(e.image)]) : null
    const data = {
      slug: String(e.slug),
      title: String(e.title),
      content: String(e.content ?? ''),
      images,
      startDate: asDate(e.start_date) ?? new Date(),
      endDate: asDate(e.end_date) ?? new Date(),
      registrationStart: asDate(e.registration_start),
      registrationEnd: asDate(e.registration_end),
      isPaid: Number(e.is_paid) === 1,
      price: Math.round(Number(e.price ?? 0)),
      hasAttendance: Number(e.has_attendance) === 1,
      hasCertificate: Number(e.has_certificate) === 1,
      certificateTemplate: str(e.certificate_template),
      status: str(e.status) ?? 'draft',
      groupIkhwan: str(e.group_ikhwan),
      groupAkhwat: str(e.group_akhwat),
      groupPublic: str(e.group_public),
      quotaIkhwan: int(e.quota_ikhwan),
      quotaAkhwat: int(e.quota_akhwat),
      autoAccept: Number(e.auto_accept) === 1,
      createdAt: asDate(e.created_at) ?? new Date(),
    }
    await prisma.event.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ events: ${events.length}`)

  const links: Row[] = await src.query('SELECT * FROM event_internal_links ORDER BY id')
  for (const l of links) {
    const id = Number(l.id)
    const data = {
      eventId: Number(l.event_id), token: String(l.token), name: String(l.name),
      quotaIkhwan: int(l.quota_ikhwan) ?? 0, quotaAkhwat: int(l.quota_akhwat) ?? 0,
      usageIkhwan: int(l.usage_ikhwan) ?? 0, usageAkhwat: int(l.usage_akhwat) ?? 0,
      activeFrom: asDate(l.active_from), activeUntil: asDate(l.active_until),
    }
    await prisma.eventInternalLink.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ event_internal_links: ${links.length}`)

  const regs: Row[] = await src.query('SELECT * FROM event_registrations ORDER BY id')
  let linked = 0
  for (const r of regs) {
    const id = Number(r.id)
    const kiasUser = int(r.user_id)
    let userId = kiasUser !== null ? userMap.get(kiasUser) ?? null : null
    if (!userId) {
      // Pendaftaran lama tanpa user_id: tautkan ke akun dengan email yang sama bila ada & belum terdaftar di event ini.
      const email = String(r.email ?? '').trim().toLowerCase()
      const u = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null
      if (u && !(await prisma.eventRegistration.findFirst({ where: { eventId: Number(r.event_id), userId: u.id, NOT: { id } } }))) userId = u.id
    }
    if (userId) linked++
    const data = {
      eventId: Number(r.event_id), userId,
      name: String(r.name ?? ''), phone: String(r.phone ?? ''), email: String(r.email ?? '').trim(),
      address: str(r.address), gender: String(r.gender ?? ''), birthPlace: str(r.birth_place), birthDate: asDate(r.birth_date),
      occupation: str(r.occupation), paymentProof: str(r.payment_proof), paymentStatus: str(r.payment_status) ?? 'pending',
      registeredAt: asDate(r.registered_at) ?? asDate(r.created_at) ?? new Date(),
      createdAt: asDate(r.created_at) ?? new Date(),
    }
    await prisma.eventRegistration.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ event_registrations: ${regs.length} (tertaut ke akun: ${linked})`)

  const att: Row[] = await src.query('SELECT * FROM event_attendances ORDER BY id')
  for (const a of att) {
    const id = Number(a.id)
    const data = { registrationId: Number(a.event_registration_id), attendedAt: asDate(a.attended_at) ?? new Date() }
    await prisma.eventAttendance.upsert({ where: { id }, update: data, create: { id, ...data } })
  }
  console.log(`✓ event_attendances: ${att.length}`)
}

async function main() {
  const u = new URL(sourceUrl!)
  const src = await mariadb.createConnection({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    dateStrings: true,
  })
  // Tahap: catalog (default) | santri | all. Tahap santri/all membutuhkan katalog sudah termigrasi.
  const stage = process.argv[2] ?? 'catalog'
  try {
    if (stage === 'catalog' || stage === 'all') await migrateCatalog(src)
    if (stage === 'santri' || stage === 'all') {
      await migrateSantri(src)
      const userMap = await migrateUsers(src)
      await migrateNotifications(src, userMap)
      await migrateEvents(src, userMap)
    }
  } finally {
    await src.end()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
