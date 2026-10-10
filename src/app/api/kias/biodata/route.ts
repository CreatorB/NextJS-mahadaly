import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { kiasBiodataSchema } from '@/lib/validations/kias'
import { normalizeNoHp } from '@/lib/kias'

export const dynamic = 'force-dynamic'

/** Santri mengubah biodatanya sendiri. */
export async function PATCH(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Silakan login terlebih dahulu'), { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kiasSantriId: true } })
  if (!user?.kiasSantriId) return Response.json(fail('Data pendaftaran KIAS tidak ditemukan'), { status: 404 })

  const parsed = kiasBiodataSchema.safeParse(await req.json())
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    }
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }
  const d = parsed.data
  const noHp = normalizeNoHp(d.noHp)
  await prisma.$transaction([
    prisma.kiasSantri.update({
      where: { id: user.kiasSantriId },
      data: {
        nama: d.nama,
        jk: d.jenisKelamin,
        tmpLahir: d.tempatLahir,
        tglLahir: new Date(d.tanggalLahir),
        alamat: d.alamat,
        noHp,
        hp: `62${noHp}`,
        pendidikan: d.pendidikan,
        pekerjaan: d.pekerjaan,
        namaAyah: d.namaAyah,
        noHpAyah: d.noHpAyah,
        namaIbu: d.namaIbu,
        noHpIbu: d.noHpIbu,
        namaWali: d.namaWali,
        noHpWali: d.noHpWali,
      },
    }),
    prisma.user.update({ where: { id: user.id }, data: { nama: d.nama } }),
  ])
  return Response.json(ok(null, 'Biodata berhasil diperbarui'))
}
