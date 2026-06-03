import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { generateKodeRegistrasi } from '@/lib/kode-registrasi'
import { isDuplicateApplicant } from '@/lib/duplicate-check'
import { saveFile, validateImageFile, validateDocFile, getPublicUrl, deleteFile } from '@/lib/upload'
import { registrationSchema } from '@/lib/validations/registration'
import { ok, fail } from '@/types/api'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const savedPaths: string[] = []
  try {
    const formData = await req.formData()

    const fields: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') fields[key] = value
    }

    const infoPsb = await prisma.infoPsb.findFirst({ orderBy: { tahunAjaran: 'desc' } })
    if (!infoPsb) return Response.json(fail('Data PSB tidak ditemukan'), { status: 400 })

    const now = new Date()
    const isOpen =
      infoPsb.statusPsb === 'Buka' &&
      (!infoPsb.datetimeOpen || infoPsb.datetimeOpen <= now) &&
      (!infoPsb.datetimeClosed || infoPsb.datetimeClosed >= now)

    if (!isOpen) return Response.json(fail('Pendaftaran sudah ditutup'), { status: 400 })

    const parsed = registrationSchema.safeParse({ ...fields, tahunPsb: infoPsb.tahunAjaran })
    if (!parsed.success) {
      const errors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        errors[key] = [...(errors[key] ?? []), issue.message]
      }
      return Response.json(fail('Data tidak valid', errors), { status: 422 })
    }
    const data = parsed.data

    const hasAyah = !!(data.namaAyah || data.noHpAyah)
    const hasIbu = !!(data.namaIbu || data.noHpIbu)
    const hasWali = !!(data.namaWali || data.noHpWali)
    if (!hasAyah && !hasIbu && !hasWali) {
      return Response.json(fail('Minimal salah satu data orang tua/wali wajib diisi (nama + no. HP)'), { status: 400 })
    }

    const photo = formData.get('photo') as File | null
    const ktp = formData.get('ktp') as File | null
    const transfer = formData.get('transfer') as File | null
    const ijazah = formData.get('ijazah') as File | null

    const fileErrors: Record<string, string[]> = {}
    if (!photo) fileErrors.photo = ['Foto wajib diupload']
    else { const e = validateImageFile(photo); if (e) fileErrors.photo = [e] }
    if (!ktp) fileErrors.ktp = ['KTP wajib diupload']
    else { const e = validateImageFile(ktp); if (e) fileErrors.ktp = [e] }
    if (!transfer) fileErrors.transfer = ['Bukti transfer wajib diupload']
    else { const e = validateImageFile(transfer); if (e) fileErrors.transfer = [e] }
    if (!ijazah) fileErrors.ijazah = ['Ijazah wajib diupload']
    else { const e = validateDocFile(ijazah); if (e) fileErrors.ijazah = [e] }

    if (Object.keys(fileErrors).length) {
      return Response.json(fail('File tidak valid', fileErrors), { status: 422 })
    }

    const jk = data.jk
    if (jk === 'Laki-Laki' && infoPsb.quotaIkhwan != null) {
      const count = await prisma.santri.count({ where: { tahunPsb: infoPsb.tahunAjaran, jk: 'Laki-Laki' } })
      if (count >= infoPsb.quotaIkhwan) return Response.json(fail('Kuota ikhwan sudah penuh'), { status: 400 })
    }
    if (jk === 'Perempuan' && infoPsb.quotaAkhwat != null) {
      const count = await prisma.santri.count({ where: { tahunPsb: infoPsb.tahunAjaran, jk: 'Perempuan' } })
      if (count >= infoPsb.quotaAkhwat) return Response.json(fail('Kuota akhwat sudah penuh'), { status: 400 })
    }

    const noHp = data.noHp
    const programIdNum = parseInt(data.programId)
    const isDup = await isDuplicateApplicant({ nama: data.nama, noHp, tahunPsb: infoPsb.tahunAjaran, programId: programIdNum })
    if (isDup) return Response.json(fail('Anda sudah terdaftar pada program dan tahun ajaran ini'), { status: 400 })

    const kode = await generateKodeRegistrasi(infoPsb.tahunAjaran)
    const tahunPsb = infoPsb.tahunAjaran

    // Normalize phone: strip +62 / 62 prefix / leading 0
    let rawNoHp = data.noHp.replace(/[\s\-\.]/g, '')
    if (rawNoHp.startsWith('+62')) rawNoHp = rawNoHp.slice(3)
    else if (rawNoHp.startsWith('62') && rawNoHp.length >= 11) rawNoHp = rawNoHp.slice(2)
    if (rawNoHp.startsWith('0')) rawNoHp = rawNoHp.slice(1)
    const normalizedNoHp = rawNoHp
    const hp = `${data.kodeNegara}${normalizedNoHp}`

    // Run file saves and bcrypt in parallel for performance
    const [photoPath, ktpPath, transferPath, ijazahPath, hashedPassword] = await Promise.all([
      saveFile(photo!, tahunPsb, kode, 'photo'),
      saveFile(ktp!, tahunPsb, kode, 'ktp'),
      saveFile(transfer!, tahunPsb, kode, 'transfer'),
      saveFile(ijazah!, tahunPsb, kode, 'ijazah'),
      bcrypt.hash(kode, 10),
    ])
    savedPaths.push(photoPath, ktpPath, transferPath, ijazahPath)

    const provinsiId = data.provinsiId ? parseInt(data.provinsiId) : null
    const kabupatenId = data.kabupatenId ? parseInt(data.kabupatenId) : null
    const kecamatanId = data.kecamatanId ? parseInt(data.kecamatanId) : null

    const newSantri = await prisma.$transaction(async (tx) => {
      const s = await tx.santri.create({
        data: {
          kodeRegistrasi: kode,
          nik: data.nik,
          nama: data.nama,
          jk: data.jk,
          tmpLahir: data.tmpLahir,
          tglLahir: new Date(data.tglLahir),
          alamat: data.alamat,
          provinsiId,
          kabupatenId,
          kecamatanId,
          namaAyah: data.namaAyah || null,
          noHpAyah: data.noHpAyah || null,
          namaIbu: data.namaIbu || null,
          noHpIbu: data.noHpIbu || null,
          namaWali: data.namaWali || null,
          noHpWali: data.noHpWali || null,
          pendidikan: data.pendidikan,
          pekerjaanId: parseInt(data.pekerjaanId),
          email: data.email,
          kodeNegara: data.kodeNegara,
          noHp: normalizedNoHp,
          hp,
          tahunPsb,
          programId: programIdNum,
          nominalTransfer: parseFloat(data.nominalTransfer),
          photo: getPublicUrl(photoPath),
          ktp: getPublicUrl(ktpPath),
          transfer: getPublicUrl(transferPath),
          ijazah: getPublicUrl(ijazahPath),
        },
      })
      await tx.user.create({
        data: {
          nama: data.nama,
          email: data.email,
          password: hashedPassword,
          roleId: 3,
          isActive: true,
          siswaId: s.id,
        },
      })
      return s
    })

    return Response.json(ok({ kodeRegistrasi: newSantri.kodeRegistrasi, nama: newSantri.nama }), { status: 201 })
  } catch (e) {
    // Cleanup orphaned files if DB transaction failed after files were saved
    if (savedPaths.length) await Promise.allSettled(savedPaths.map(p => deleteFile(p)))
    console.error(e)
    return Response.json(fail('Terjadi kesalahan server'), { status: 500 })
  }
}