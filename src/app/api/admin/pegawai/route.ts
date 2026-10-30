import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import {
  PASSWORD_DEFAULT_PEGAWAI,
  ROLE_ID_PEGAWAI,
  bersihkanDataPegawai,
} from '@/lib/pegawai'
import { normalisasiHp } from '@/lib/phone'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/admin/pegawai?q= — daftar pegawai + ringkasan absensi 30 hari. */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()

  const pegawai = await prisma.pegawai.findMany({
    where: q
      ? {
          OR: [
            { nama: { contains: q } },
            { jabatan: { contains: q } },
            { noHp: { contains: normalisasiHp(q) || q } },
            { email: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { nama: 'asc' },
    include: {
      user: { select: { id: true, email: true, isActive: true, passwordChangedAt: true } },
      absensi: {
        where: { tanggal: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { tanggal: true, jamMasuk: true, jamPulang: true, status: true },
      },
    },
  })

  return Response.json(
    ok(
      pegawai.map((p) => {
        const hadir = p.absensi.filter((a) => a.jamMasuk).length
        const telat = p.absensi.filter((a) => a.status === 'telat').length
        return {
          id: p.id,
          nama: p.nama,
          jabatan: p.jabatan,
          noHp: p.noHp,
          email: p.email,
          nik: p.nik,
          jk: p.jk,
          tmpLahir: p.tmpLahir,
          tglLahir: p.tglLahir ? p.tglLahir.toISOString().slice(0, 10) : null,
          pendidikan: p.pendidikan,
          statusPernikahan: p.statusPernikahan,
          alamat: p.alamat,
          tahunBergabung: p.tahunBergabung,
          kontakKeluarga: p.kontakKeluarga,
          isActive: p.isActive,
          akun: p.user
            ? {
                id: p.user.id,
                email: p.user.email,
                isActive: p.user.isActive,
                passwordSudahDiubah: Boolean(p.user.passwordChangedAt),
              }
            : null,
          absensi30Hari: { hadir, telat, total: p.absensi.length },
        }
      }),
    ),
  )
}

/**
 * POST /api/admin/pegawai
 * Menambah pegawai baru + membuat akun login (role pegawai).
 * Password awal = 123456, bisa diganti pegawai sendiri di halaman profil.
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const nama = String(body.nama ?? '').trim()
  if (nama.length < 3) {
    return Response.json(fail('Nama pegawai minimal 3 karakter.'), { status: 400 })
  }

  const data = bersihkanDataPegawai({
    nama,
    jabatan: body.jabatan as string,
    noHp: body.noHp as string,
    email: body.email as string,
    nik: body.nik as string,
    jk: body.jk as string,
    tmpLahir: body.tmpLahir as string,
    pendidikan: body.pendidikan as string,
    statusPernikahan: body.statusPernikahan as string,
    alamat: body.alamat as string,
    tahunBergabung: body.tahunBergabung as string,
    kontakKeluarga: body.kontakKeluarga as string,
  })

  if (!data.noHp && !data.email) {
    return Response.json(
      fail('Isi minimal salah satu: nomor WhatsApp atau email (dipakai untuk login).'),
      { status: 400 },
    )
  }

  if (data.noHp) {
    const bentrok = await prisma.pegawai.findFirst({ where: { noHp: data.noHp }, select: { nama: true } })
    if (bentrok) {
      return Response.json(fail(`Nomor WhatsApp sudah dipakai pegawai lain (${bentrok.nama}).`), { status: 400 })
    }
  }

  const dibuat = await prisma.pegawai.create({ data: { ...data, tglLahir: null } })

  // Akun login: pakai email yang ada, kalau kosong dibuatkan email internal.
  const emailAkun = data.email ?? `pegawai-${dibuat.id}@mahadaly.syathiby.id`
  const emailBentrok = await prisma.user.findUnique({
    where: { email: emailAkun },
    select: { id: true },
  })
  if (emailBentrok) {
    return Response.json(fail(`Email ${emailAkun} sudah dipakai akun lain.`), { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      nama,
      email: emailAkun,
      password: await bcrypt.hash(PASSWORD_DEFAULT_PEGAWAI, 10),
      roleId: ROLE_ID_PEGAWAI,
      isActive: true,
    },
  })

  await prisma.pegawai.update({ where: { id: dibuat.id }, data: { userId: user.id } })

  return Response.json(
    ok(
      { pegawai: dibuat, akun: { id: user.id, email: emailAkun }, passwordAwal: PASSWORD_DEFAULT_PEGAWAI },
      `Pegawai ditambahkan. Password awal: ${PASSWORD_DEFAULT_PEGAWAI}`,
    ),
    { status: 201 },
  )
}
