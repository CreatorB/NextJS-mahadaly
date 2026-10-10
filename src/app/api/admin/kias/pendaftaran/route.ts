import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { generateKiasKode, normalizeNoHp } from '@/lib/kias'

export const dynamic = 'force-dynamic'

const opt = z.string().trim().max(255).optional().nullable().transform((v) => v || null)

/** Pendaftaran susulan oleh admin: langsung Diterima + transfer Valid, tanpa berkas (sama dengan KIAS lama). */
const schema = z.object({
  nama: z.string().trim().min(3, 'Nama minimal 3 karakter').max(200),
  jk: z.enum(['Laki-Laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
  programId: z.coerce.number().int().positive('Pilih kelas'),
  tahunPsb: z.string().trim().min(4, 'Pilih tahun ajaran'),
  noHp: z.string().trim().regex(/^[0-9+\-\s.]{8,20}$/, 'Nomor HP tidak valid'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid').optional().or(z.literal('')),
  nik: opt, nisn: opt, tmpLahir: opt,
  tglLahir: z.string().optional().nullable().transform((v) => (v ? new Date(v) : null)),
  alamat: opt, pendidikan: opt, pekerjaan: opt,
  namaAyah: opt, noHpAyah: opt, namaIbu: opt, noHpIbu: opt, namaWali: opt, noHpWali: opt,
})

export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const i of parsed.error.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }
  const d = parsed.data
  if (!(await prisma.kiasInfoPsb.findUnique({ where: { tahunAjaran: d.tahunPsb } }))) {
    return Response.json(fail('Data tidak valid', { tahunPsb: ['Tahun ajaran tidak dikenal'] }), { status: 422 })
  }
  if (!(await prisma.kiasProgram.findUnique({ where: { id: d.programId } }))) {
    return Response.json(fail('Data tidak valid', { programId: ['Kelas tidak ditemukan'] }), { status: 422 })
  }

  const kode = await generateKiasKode(d.tahunPsb)
  const email = d.email || `${kode}@kias.local`
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return Response.json(fail('Data tidak valid', { email: ['Email sudah terdaftar'] }), { status: 422 })
  }
  const noHp = normalizeNoHp(d.noHp)
  const password = await bcrypt.hash(kode, 10)

  await prisma.$transaction(async (tx) => {
    const s = await tx.kiasSantri.create({
      data: {
        kodeRegistrasi: kode, nama: d.nama, jk: d.jk, nik: d.nik, nisn: d.nisn, tmpLahir: d.tmpLahir, tglLahir: d.tglLahir,
        alamat: d.alamat, pendidikan: d.pendidikan, pekerjaan: d.pekerjaan,
        namaAyah: d.namaAyah, noHpAyah: d.noHpAyah, namaIbu: d.namaIbu, noHpIbu: d.noHpIbu, namaWali: d.namaWali, noHpWali: d.noHpWali,
        email: d.email || null, kodeNegara: '62', noHp, hp: `62${noHp}`, tahunPsb: d.tahunPsb, programId: d.programId,
        statusPendaftaran: 'Diterima', statusTransfer: 'Valid', tglVerifikasi: new Date(),
      },
    })
    await tx.user.create({ data: { nama: d.nama, email, password, roleId: 3, isActive: true, kiasSantriId: s.id } })
  })

  return Response.json(ok({ kodeRegistrasi: kode, email }, `Pendaftaran susulan dibuat. Kode & password: ${kode}`), { status: 201 })
}
