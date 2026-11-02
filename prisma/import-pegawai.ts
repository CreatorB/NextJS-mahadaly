/**
 * Import data pegawai dari prisma/data/pegawai.json (hasil konversi
 * "DATA PEGAWAI MAHAD ALY.xlsx" oleh prisma/import-pegawai-xlsx.py).
 *
 * Pakai:  npm run db:import-pegawai
 *
 * Sifat: idempoten — boleh dijalankan berkali-kali. Data pegawai dicocokkan
 * dengan urutan: NIK -> (nama + noHp) -> nama. Akun `users` hanya dibuat
 * bila belum ada; password awal = 123456 (bisa diganti pegawai sendiri).
 * Nomor WhatsApp, email, dan seluruh detail profil ikut diperbarui.
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'

const PASSWORD_AWAL = '123456'
const ROLE_ID_PEGAWAI = 5
const SUMBER = 'DATA PEGAWAI MAHAD ALY.xlsx'

interface DataPegawai {
  kode: string | null
  nama: string
  jabatan: string | null
  noHp: string | null
  noHpMentah: string | null
  email: string | null
  nik: string | null
  jk: string | null
  tmpLahir: string | null
  tglLahir: string | null
  pendidikan: string | null
  statusPernikahan: string | null
  alamat: string | null
  tahunBergabung: string | null
  kontakKeluarga: string | null
  fotoUrl: string | null
  ijazahUrl: string | null
}

interface IsiFile {
  catatan: string[]
  pegawai: DataPegawai[]
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function teks(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

async function cariPegawai(d: DataPegawai) {
  if (d.nik) {
    const byNik = await prisma.pegawai.findFirst({ where: { nik: d.nik } })
    if (byNik) return byNik
  }
  if (d.noHp) {
    const byHp = await prisma.pegawai.findFirst({ where: { noHp: d.noHp } })
    if (byHp) return byHp
  }
  return prisma.pegawai.findFirst({ where: { nama: d.nama } })
}

async function main() {
  const file = join(process.cwd(), 'prisma', 'data', 'pegawai.json')
  let isi: IsiFile
  try {
    const mentah = JSON.parse(readFileSync(file, 'utf8')) as IsiFile | DataPegawai[]
    isi = Array.isArray(mentah)
      ? { catatan: [], pegawai: mentah as DataPegawai[] }
      : { catatan: mentah.catatan ?? [], pegawai: mentah.pegawai ?? [] }
  } catch (e) {
    console.error(`Gagal membaca ${file}. Jalankan dulu: python prisma/import-pegawai-xlsx.py`)
    console.error(e)
    process.exit(1)
  }

  await prisma.role.upsert({
    where: { namaRole: 'pegawai' },
    update: {},
    create: { id: ROLE_ID_PEGAWAI, namaRole: 'pegawai' },
  })

  let dibuat = 0
  let diperbarui = 0
  let akunBaru = 0
  let akunDiperbarui = 0
  const catatan: string[] = [...isi.catatan]

  for (const d of isi.pegawai) {
    const nama = (d.nama ?? '').trim()
    if (!nama) continue

    const data = {
      kode: teks(d.kode),
      nama,
      jabatan: teks(d.jabatan),
      noHp: teks(d.noHp),
      email: teks(d.email)?.toLowerCase() ?? null,
      nik: teks(d.nik),
      jk: teks(d.jk),
      tmpLahir: teks(d.tmpLahir),
      tglLahir: d.tglLahir ? new Date(`${d.tglLahir}T00:00:00Z`) : null,
      pendidikan: teks(d.pendidikan),
      statusPernikahan: teks(d.statusPernikahan),
      alamat: teks(d.alamat),
      tahunBergabung: teks(d.tahunBergabung),
      kontakKeluarga: teks(d.kontakKeluarga),
      fotoUrl: teks(d.fotoUrl),
      ijazahUrl: teks(d.ijazahUrl),
      isActive: true,
    }

    const lama = await cariPegawai(d)
    const pegawai = lama
      ? await prisma.pegawai.update({ where: { id: lama.id }, data })
      : await prisma.pegawai.create({ data })

    if (lama) diperbarui++
    else dibuat++

    // Nomor WhatsApp bentrok dengan pegawai lain -> cari yang sama-sama bentrok.
    if (data.noHp) {
      const bentrok = await prisma.pegawai.findFirst({
        where: { noHp: data.noHp, NOT: { id: pegawai.id } },
        select: { nama: true },
      })
      if (bentrok) {
        catatan.push(
          `DB: nomor ${data.noHp} milik ${pegawai.nama} juga dipakai ${bentrok.nama}. Nomor ${pegawai.nama} dikosongkan.`,
        )
        await prisma.pegawai.update({ where: { id: pegawai.id }, data: { noHp: null } })
      }
    }

    // Akun login.
    if (!pegawai.userId) {
      const emailDiminta = data.email
      let userId: number | null = null

      if (emailDiminta) {
        const userAda = await prisma.user.findUnique({ where: { email: emailDiminta } })
        if (userAda) {
          if (userAda.roleId === ROLE_ID_PEGAWAI) {
            userId = userAda.id
            await prisma.user.update({
              where: { id: userAda.id },
              data: { nama, isActive: true },
            })
            akunDiperbarui++
          } else {
            catatan.push(
              `${nama}: email ${emailDiminta} sudah dipakai akun ber-role lain (id ${userAda.id}). Akun email internal dipakai.`,
            )
          }
        }
      }

      if (!userId) {
        const emailInternal = `pegawai-${pegawai.id}@mahadaly.syathiby.id`
        const bentrok = await prisma.user.findUnique({ where: { email: emailInternal } })
        if (bentrok && bentrok.roleId === ROLE_ID_PEGAWAI) {
          userId = bentrok.id
        } else {
          const user = await prisma.user.create({
            data: {
              nama,
              email: emailInternal,
              password: await bcrypt.hash(PASSWORD_AWAL, 10),
              roleId: ROLE_ID_PEGAWAI,
              isActive: true,
            },
          })
          userId = user.id
          akunBaru++
          if (!emailDiminta) {
            catatan.push(`${nama}: tanpa email -> akun dibuat dengan ${emailInternal}.`)
          }
        }
      }

      if (userId) {
        await prisma.pegawai.update({ where: { id: pegawai.id }, data: { userId } })
      }
    } else {
      // Akun sudah ada -> sinkronkan nama & email bila Excel berubah.
      const user = await prisma.user.findUnique({
        where: { id: pegawai.userId },
        select: { id: true, nama: true, email: true, roleId: true },
      })
      if (user && data.email && data.email !== user.email) {
        const bentrok = await prisma.user.findUnique({
          where: { email: data.email },
          select: { id: true },
        })
        if (!bentrok || bentrok.id === user.id) {
          await prisma.user.update({ where: { id: user.id }, data: { nama, email: data.email } })
          akunDiperbarui++
        }
      } else if (user && user.nama !== nama) {
        await prisma.user.update({ where: { id: user.id }, data: { nama } })
      }
    }
  }

  await prisma.riwayatImportPegawai.create({
    data: {
      sumber: SUMBER,
      jumlahPegawai: isi.pegawai.length,
      jumlahBaru: dibuat,
      jumlahUpdate: diperbarui,
      catatan: catatan.length ? catatan.join('\n') : null,
    },
  })

  console.log(`Selesai. Total data: ${isi.pegawai.length}`)
  console.log(`  pegawai baru   : ${dibuat}`)
  console.log(`  pegawai update : ${diperbarui}`)
  console.log(`  akun dibuat    : ${akunBaru} (password awal ${PASSWORD_AWAL})`)
  console.log(`  akun update    : ${akunDiperbarui}`)
  const tanpaWa = isi.pegawai.filter((p) => !p.noHp).length
  console.log(`  tanpa nomor WA : ${tanpaWa}`)
  if (catatan.length) {
    console.log('Catatan:')
    for (const c of catatan) console.log(`  - ${c}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
