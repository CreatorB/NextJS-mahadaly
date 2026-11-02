import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'
import { ambilPegawaiDariUserId, bersihkanDataPegawai } from '@/lib/pegawai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/absen/profil — data diri pegawai yang sedang login. */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    return Response.json(
      ok({
        id: pegawai.id,
        nama: pegawai.nama,
        jabatan: pegawai.jabatan,
        noHp: pegawai.noHp,
        email: pegawai.email ?? pegawai.user?.email ?? null,
        nik: pegawai.nik,
        jk: pegawai.jk,
        tmpLahir: pegawai.tmpLahir,
        tglLahir: pegawai.tglLahir ? pegawai.tglLahir.toISOString().slice(0, 10) : null,
        pendidikan: pegawai.pendidikan,
        statusPernikahan: pegawai.statusPernikahan,
        alamat: pegawai.alamat,
        tahunBergabung: pegawai.tahunBergabung,
        kontakKeluarga: pegawai.kontakKeluarga,
        fotoUrl: pegawai.fotoUrl,
        akunEmail: pegawai.user?.email ?? null,
      }),
    )
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan.'), { status: 500 })
  }
}

/**
 * PATCH /api/absen/profil
 * Pegawai menyunting data dirinya sendiri (khususnya nomor WhatsApp yang
 * dipakai untuk login, plus data kontak lainnya).
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const pegawai = await ambilPegawaiDariUserId(session.userId)
    if (!pegawai) return Response.json(fail('Akun ini bukan pegawai.'), { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

    if (body.noHp !== undefined) {
      const baru = bersihkanDataPegawai({ nama: pegawai.nama, noHp: body.noHp as string }).noHp
      if (baru) {
        const bentrok = await prisma.pegawai.findFirst({
          where: { noHp: baru, NOT: { id: pegawai.id } },
          select: { id: true, nama: true },
        })
        if (bentrok) {
          return Response.json(
            fail(`Nomor WhatsApp tersebut sudah dipakai pegawai lain (${bentrok.nama}).`),
            { status: 400 },
          )
        }
      }
    }

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
      isActive: pegawai.isActive,
    })

    // Nomor WhatsApp di akun login ikut diperbarui supaya konsisten.
    if (data.noHp !== pegawai.noHp) {
      await prisma.pegawai.update({ where: { id: pegawai.id }, data: { noHp: data.noHp } })
    }

    const updated = await prisma.pegawai.update({
      where: { id: pegawai.id },
      data: {
        nama: data.nama,
        jabatan: data.jabatan,
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
      },
    })

    return Response.json(ok(updated, 'Data profil berhasil disimpan.'))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat menyimpan profil.'), { status: 500 })
  }
}
