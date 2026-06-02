import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Roles
  const roles = [
    { id: 1, namaRole: 'superadmin' },
    { id: 2, namaRole: 'admin' },
    { id: 3, namaRole: 'santri' },
  ]
  for (const r of roles) {
    await prisma.role.upsert({ where: { namaRole: r.namaRole }, update: {}, create: r })
  }
  console.log('✓ Roles seeded')

  // Program — only HKI
  await prisma.program.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      namaProgram: 'Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1',
      statusPsb: 'Buka',
      keterangan: 'Program Sarjana S1, 8 semester (4 tahun), 156 SKS',
    },
  })
  console.log('✓ Program seeded')

  // Pekerjaan
  const pekerjaans = [
    'Pelajar/Mahasiswa',
    'Karyawan Swasta',
    'PNS/TNI/Polri',
    'Wiraswasta',
    'Petani/Nelayan',
    'Lainnya',
  ]
  for (let i = 0; i < pekerjaans.length; i++) {
    await prisma.pekerjaan.upsert({
      where: { id: i + 1 },
      update: {},
      create: { id: i + 1, nama: pekerjaans[i] },
    })
  }
  console.log('✓ Pekerjaan seeded')

  // InfoPsb
  await prisma.infoPsb.upsert({
    where: { tahunAjaran: '2026' },
    update: {},
    create: {
      tahunAjaran: '2026',
      statusPsb: 'Buka',
      datetimeOpen: new Date('2026-05-25T00:00:00.000Z'),
      datetimeClosed: new Date('2026-08-19T23:59:59.000Z'),
      quotaIkhwan: 30,
      quotaAkhwat: 30,
      biayaPendaftaran: 150000,
      biayaPangkal: 5250000,
      biayaKuliahSemester: 3000000,
      biayaCicilanBulanan: 500000,
    },
  })
  console.log('✓ InfoPsb seeded')

  // SuperAdmin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'superadmin@mahadaly.syathiby.id'
  const adminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'superadmin123', 10)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nama: 'Super Admin',
      email: adminEmail,
      password: adminPass,
      roleId: 1,
      isActive: true,
    },
  })
  console.log('✓ SuperAdmin seeded')

  // Admin
  const adminHash = await bcrypt.hash('qweasd123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@mahadaly.syathiby.id' },
    update: {},
    create: {
      nama: 'Admin',
      email: 'admin@mahadaly.syathiby.id',
      password: adminHash,
      roleId: 2,
      isActive: true,
    },
  })
  console.log('✓ Admin seeded')

  console.log('\n✅ Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
