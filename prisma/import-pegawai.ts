/**
 * Import data pegawai dari prisma/data/pegawai.json (hasil konversi
 * "DATA PEGAWAI MAHAD ALY.xlsx" oleh prisma/import-pegawai-xlsx.py).
 *
 * Pakai:  npx tsx prisma/import-pegawai.ts
 *
 * Sifat: idempoten — boleh dijalankan berkali-kali. Data pegawai dicocokkan
 * dengan urutan: NIK -> (nama + noHp) -> nama. Akun `users` hanya dibuat
 * bila belum ada; password awal = 123456 (bisa diganti pegawai sendiri).
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'

const PASSWORD_AWAL = '123456'
const ROLE_ID_PEGAWAI = 5

interface DataPegawai {
  nama: string
  jabatan: string | null
  noHp: string | null
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
  let daftar: DataPegawai[]
  try {
    daftar = JSON.parse(readFileSync(file, 'utf8')) as DataPegawai[]
  } catch (e) {
    console.error(`Gagal membaca ${file}. Jalankan dulu: python prisma/import-pegawai-xlsx.py`)
    console.error(e)
    process.exit(1)
  }

  // Pastikan role pegawai ada.
  await prisma.role.upsert({
    where: { namaRole: 'pegawai' },
    update: {},
    create: { id: ROLE_ID_PEGAWAI, namaRole: 'pegawai' },
  })

  let dibuat = 0
  let diperbarui = 0
  let akunBaru = 0
  const catatan: string[] = []

  for (const d of daftar) {
    const nama = (d.nama ?? '').trim()
    if (!nama) continue

    const data = {
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
      isActive: true,
    }

    const lama = await cariPegawai(d)
    const pegawai = lama
      ? await prisma.pegawai.update({ where: { id: lama.id }, data })
      : await prisma.pegawai.create({ data })

    if (lama) diperbarui++
    else dibuat++

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
    }
  }

  console.log(`Selesai. Total data: ${daftar.length}`)
  console.log(`  pegawai baru   : ${dibuat}`)
  console.log(`  pegawai update : ${diperbarui}`)
  console.log(`  akun dibuat    : ${akunBaru} (password awal ${PASSWORD_AWAL})`)
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
