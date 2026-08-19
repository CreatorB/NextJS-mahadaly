import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { generateKodeRegistrasi } from '@/lib/kode-registrasi'
import { ok, fail } from '@/types/api'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) {
    return Response.json(fail('Unauthorized'), { status: 401 })
  }
  return Response.json(ok({ message: 'Admin bypass endpoint ready' }))
}

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) {
    return Response.json(fail('Unauthorized'), { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      nik,
      nama,
      jk,
      tmpLahir,
      tglLahir,
      alamat,
      provinsiId,
      kabupatenId,
      kecamatanId,
      namaAyah,
      noHpAyah,
      namaIbu,
      noHpIbu,
      namaWali,
      noHpWali,
      programId,
      pendidikan,
      pekerjaanId,
      email,
      kodeNegara,
      noHp,
      tahunPsb,
    } = body ?? {}

    const missing: string[] = []
    if (!nik) missing.push('nik')
    if (!nama) missing.push('nama')
    if (!jk) missing.push('jk')
    if (!tmpLahir) missing.push('tmpLahir')
    if (!tglLahir) missing.push('tglLahir')
    if (!alamat) missing.push('alamat')
    if (!programId) missing.push('programId')
    if (!pendidikan) missing.push('pendidikan')
    if (!pekerjaanId) missing.push('pekerjaanId')
    if (!email) missing.push('email')
    if (!noHp) missing.push('noHp')
    if (missing.length) {
      return Response.json(fail('Field wajib belum lengkap: ' + missing.join(', ')), { status: 422 })
    }

    if (jk !== 'Laki-Laki' && jk !== 'Perempuan') {
      return Response.json(fail('Jenis kelamin harus Laki-Laki atau Perempuan'), { status: 422 })
    }

    const infoPsb = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
    if (!infoPsb) {
      return Response.json(fail('Data InfoPsb tidak ditemukan'), { status: 400 })
    }
    const tahun = tahunPsb || infoPsb.tahunAjaran

    const programIdNum = parseInt(String(programId))
    const pekerjaanIdNum = parseInt(String(pekerjaanId))
    if (Number.isNaN(programIdNum) || Number.isNaN(pekerjaanIdNum)) {
      return Response.json(fail('programId/pekerjaanId tidak valid'), { status: 422 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return Response.json(fail('Email sudah digunakan'), { status: 400 })
    }

    const existingNik = await prisma.santri.findFirst({ where: { nik: String(nik) } })
    if (existingNik) {
      return Response.json(fail('NIK sudah terdaftar'), { status: 400 })
    }

    const kode = await generateKodeRegistrasi(tahun)

    let rawNoHp = String(noHp).replace(/[\s\-\.]/g, '')
    if (rawNoHp.startsWith('+62')) rawNoHp = rawNoHp.slice(3)
    else if (rawNoHp.startsWith('62') && rawNoHp.length >= 11) rawNoHp = rawNoHp.slice(2)
    if (rawNoHp.startsWith('0')) rawNoHp = rawNoHp.slice(1)
    const normalizedNoHp = rawNoHp
    const finalKodeNegara = kodeNegara || '62'
    const hp = `${finalKodeNegara}${normalizedNoHp}`

    const hashedPassword = await bcrypt.hash(kode, 10)

    const newSantri = await prisma.$transaction(async (tx) => {
      const s = await tx.santri.create({
        data: {
          kodeRegistrasi: kode,
          nik: String(nik),
          nama: String(nama),
          jk,
          tmpLahir: String(tmpLahir),
          tglLahir: new Date(String(tglLahir)),
          alamat: String(alamat),
          provinsiId: provinsiId ? parseInt(String(provinsiId)) : null,
          kabupatenId: kabupatenId ? parseInt(String(kabupatenId)) : null,
          kecamatanId: kecamatanId ? parseInt(String(kecamatanId)) : null,
          namaAyah: namaAyah || null,
          noHpAyah: noHpAyah || null,
          namaIbu: namaIbu || null,
          noHpIbu: noHpIbu || null,
          namaWali: namaWali || null,
          noHpWali: noHpWali || null,
          pendidikan: String(pendidikan),
          pekerjaanId: pekerjaanIdNum,
          email: String(email),
          kodeNegara: finalKodeNegara,
          noHp: normalizedNoHp,
          hp,
          tahunPsb: tahun,
          programId: programIdNum,
          statusPendaftaran: 'approved',
          statusTransfer: 'approved',
          tglVerifikasi: new Date(),
        },
      })
      await tx.user.create({
        data: {
          nama: String(nama),
          email: String(email),
          password: hashedPassword,
          roleId: 3,
          isActive: true,
          siswaId: s.id,
        },
      })
      return s
    })

    return Response.json(
      ok({
        message: 'Santri berhasil ditambahkan oleh admin (bypass)',
        kodeRegistrasi: newSantri.kodeRegistrasi,
        nama: newSantri.nama,
        id: newSantri.id,
      }),
      { status: 201 }
    )
  } catch (e: any) {
    console.error('[admin/santri] bypass error:', e?.message ?? e)
    return Response.json(fail('Terjadi kesalahan server: ' + (e?.message ?? 'unknown')), { status: 500 })
  }
}
