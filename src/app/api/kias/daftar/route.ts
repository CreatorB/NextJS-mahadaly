import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { kiasDaftarSchema } from '@/lib/validations/kias'
import { generateKiasKode, getActiveKiasInfo, getKiasQuota, isKiasPsbOpen, KIAS_JENIS_DAFTAR, normalizeNoHp } from '@/lib/kias'
import { removeKiasDir, saveKiasBerkas, validateKiasImage } from '@/lib/kias-berkas'
import { isKiasManualVerified, KIAS_MANUAL_COOKIE } from '@/lib/kias-manual'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let savedDir: { tahun: string; kode: string } | null = null
  try {
    const info = await getActiveKiasInfo()
    if (!info || !isKiasPsbOpen(info)) return Response.json(fail('Pendaftaran KIAS sudah ditutup.'), { status: 400 })

    const form = await req.formData()
    const fields: Record<string, string> = {}
    for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v

    const parsed = kiasDaftarSchema.safeParse(fields)
    const errors: Record<string, string[]> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        errors[key] = [...(errors[key] ?? []), issue.message]
      }
    }
    const files = {
      photo: form.get('foto') as File | null,
      ktp: form.get('ktp') as File | null,
      transfer: form.get('buktiPembayaran') as File | null,
    }
    const fileLabels = { photo: ['foto', 'Pas foto'], ktp: ['ktp', 'KTP'], transfer: ['buktiPembayaran', 'Bukti pembayaran'] } as const
    for (const key of Object.keys(files) as (keyof typeof files)[]) {
      const [field, label] = fileLabels[key]
      const e = validateKiasImage(files[key], label)
      if (e) errors[field] = [e]
    }
    if (!parsed.success || Object.keys(errors).length) return Response.json(fail('Data tidak valid', errors), { status: 422 })
    const d = parsed.data

    const program = await prisma.kiasProgram.findUnique({ where: { id: d.programId } })
    if (!program || program.statusPsb !== 'Buka' || !KIAS_JENIS_DAFTAR.includes(program.jenisProgramId)) {
      return Response.json(fail('Data tidak valid', { programId: ['Kelas yang dipilih tidak menerima pendaftaran'] }), { status: 422 })
    }

    if (await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } })) {
      return Response.json(fail('Data tidak valid', { email: ['Email sudah terdaftar, gunakan email lain atau login'] }), { status: 422 })
    }

    const manual = await isKiasManualVerified(info.id, req.cookies.get(KIAS_MANUAL_COOKIE)?.value)
    const quota = await getKiasQuota(info)
    const sisa = d.jenisKelamin === 'Laki-Laki' ? quota.sisaIkhwan : quota.sisaAkhwat
    if (!manual && sisa !== null && sisa <= 0) {
      return Response.json(fail(`Kuota ${d.jenisKelamin === 'Laki-Laki' ? 'ikhwan' : 'akhwat'} sudah penuh`), { status: 400 })
    }

    const kode = await generateKiasKode(info.tahunAjaran)
    savedDir = { tahun: info.tahunAjaran, kode }
    const [photo, ktp, transfer, password] = await Promise.all([
      saveKiasBerkas(files.photo!, info.tahunAjaran, kode, 'photo'),
      saveKiasBerkas(files.ktp!, info.tahunAjaran, kode, 'ktp'),
      saveKiasBerkas(files.transfer!, info.tahunAjaran, kode, 'transfer'),
      bcrypt.hash(kode, 10),
    ])

    const noHp = normalizeNoHp(d.noHp)
    const santri = await prisma.$transaction(async (tx) => {
      const s = await tx.kiasSantri.create({
        data: {
          kodeRegistrasi: kode,
          nama: d.nama,
          jk: d.jenisKelamin,
          nik: d.nik,
          nisn: d.nisn,
          tmpLahir: d.tempatLahir,
          tglLahir: new Date(d.tanggalLahir),
          alamat: d.alamat,
          namaAyah: d.namaAyah,
          noHpAyah: d.noHpAyah,
          namaIbu: d.namaIbu,
          noHpIbu: d.noHpIbu,
          namaWali: d.namaWali,
          noHpWali: d.noHpWali,
          pendidikan: d.pendidikan,
          pekerjaan: d.pekerjaan,
          email: d.email,
          kodeNegara: '62',
          noHp,
          hp: `62${noHp}`,
          tahunPsb: info.tahunAjaran,
          programId: program.id,
          photo,
          ktp,
          transfer,
          nominalTransfer: info.biayaPendaftaran,
          statusTransfer: 'Cek',
          statusPendaftaran: 'Menunggu',
        },
      })
      const user = await tx.user.create({
        data: { nama: d.nama, email: d.email, password, roleId: 3, isActive: true, kiasSantriId: s.id },
      })
      await tx.kiasNotification.create({
        data: {
          userId: user.id,
          kiasSantriId: s.id,
          type: 'pendaftaran',
          title: 'Pendaftaran Berhasil',
          message: `Pendaftaran Anda telah berhasil disimpan. Nomor Peserta Anda: ${kode}. Silakan tunggu verifikasi dari admin.`,
        },
      })
      return s
    })

    return Response.json(ok({ kodeRegistrasi: santri.kodeRegistrasi, nama: santri.nama, email: d.email }), { status: 201 })
  } catch (e) {
    if (savedDir) await removeKiasDir(savedDir.tahun, savedDir.kode)
    console.error('[kias-daftar]', e)
    return Response.json(fail('Terjadi kesalahan server, silakan coba lagi'), { status: 500 })
  }
}
