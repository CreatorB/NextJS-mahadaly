import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { bersihkanDataPegawai } from '@/lib/pegawai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/admin/pegawai/:id — ubah data pegawai. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const id = Number((await params).id)
  if (!Number.isFinite(id)) return Response.json(fail('ID tidak valid'), { status: 400 })

  const pegawai = await prisma.pegawai.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true } } },
  })
  if (!pegawai) return Response.json(fail('Pegawai tidak ditemukan'), { status: 404 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  const data = bersihkanDataPegawai({
    nama: (body.nama as string) ?? pegawai.nama,
    jabatan: (body.jabatan as string) ?? pegawai.jabatan,
    noHp: (body.noHp as string) ?? pegawai.noHp,
    email: (body.email as string) ?? pegawai.email,
    nik: (body.nik as string) ?? pegawai.nik,
    jk: (body.jk as string) ?? pegawai.jk,
    tmpLahir: (body.tmpLahir as string) ?? pegawai.tmpLahir,
    pendidikan: (body.pendidikan as string) ?? pegawai.pendidikan,
    statusPernikahan: (body.statusPernikahan as string) ?? pegawai.statusPernikahan,
    alamat: (body.alamat as string) ?? pegawai.alamat,
    tahunBergabung: (body.tahunBergabung as string) ?? pegawai.tahunBergabung,
    kontakKeluarga: (body.kontakKeluarga as string) ?? pegawai.kontakKeluarga,
    fotoUrl: (body.fotoUrl as string) ?? pegawai.fotoUrl,
    isActive: body.isActive === undefined ? pegawai.isActive : Boolean(body.isActive),
  })

  if (!data.nama || data.nama.length < 3) {
    return Response.json(fail('Nama pegawai minimal 3 karakter.'), { status: 400 })
  }

  if (data.noHp) {
    const bentrok = await prisma.pegawai.findFirst({
      where: { noHp: data.noHp, NOT: { id } },
      select: { nama: true },
    })
    if (bentrok) {
      return Response.json(fail(`Nomor WhatsApp sudah dipakai pegawai lain (${bentrok.nama}).`), { status: 400 })
    }
  }

  const updated = await prisma.pegawai.update({
    where: { id },
    data: {
      nama: data.nama,
      jabatan: data.jabatan,
      noHp: data.noHp,
      email: data.email,
      nik: data.nik,
      jk: data.jk,
      tmpLahir: data.tmpLahir,
      pendidikan: data.pendidikan,
      statusPernikahan: data.statusPernikahan,
      alamat: data.alamat,
      tahunBergabung: data.tahunBergabung,
      kontakKeluarga: data.kontakKeluarga,
      fotoUrl: data.fotoUrl,
      isActive: data.isActive,
    },
  })

  // Sinkronkan akun login: nama, email, dan status aktif.
  if (pegawai.user) {
    const akunPatch: Record<string, unknown> = { nama: data.nama }
    if (data.email && data.email !== pegawai.user.email) {
      const emailBentrok = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      })
      if (emailBentrok && emailBentrok.id !== pegawai.user.id) {
        return Response.json(fail(`Email ${data.email} sudah dipakai akun lain.`), { status: 400 })
      }
      akunPatch.email = data.email
    }
    akunPatch.isActive = data.isActive
    await prisma.user.update({ where: { id: pegawai.user.id }, data: akunPatch })
  }

  return Response.json(ok(updated, 'Data pegawai berhasil diperbarui.'))
}

/**
 * DELETE /api/admin/pegawai/:id
 * Menonaktifkan pegawai (data & riwayat absensi tetap disimpan).
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const id = Number((await params).id)
  if (!Number.isFinite(id)) return Response.json(fail('ID tidak valid'), { status: 400 })

  const pegawai = await prisma.pegawai.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  })
  if (!pegawai) return Response.json(fail('Pegawai tidak ditemukan'), { status: 404 })

  await prisma.pegawai.update({ where: { id }, data: { isActive: false } })
  if (pegawai.user) {
    await prisma.user.update({ where: { id: pegawai.user.id }, data: { isActive: false } })
  }

  return Response.json(ok(null, `Pegawai ${pegawai.nama} dinonaktifkan.`))
}
