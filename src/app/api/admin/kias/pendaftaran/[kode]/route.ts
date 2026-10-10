import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { KIAS_STATUS_SANTRI, notifyKiasSantri, requireAdminApi } from '@/lib/kias-admin'
import { removeKiasDir } from '@/lib/kias-berkas'
import { normalizeNoHp } from '@/lib/kias'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ kode: string }> }

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('terima') }),
  z.object({ action: z.literal('tolak'), alasan: z.string().trim().min(3, 'Alasan wajib diisi').max(500) }),
  z.object({
    action: z.literal('transfer'),
    status: z.enum(['Cek', 'Valid', 'Invalid']),
    alasan: z.string().trim().max(500).optional(),
  }),
  z.object({ action: z.literal('notifikasi-wa') }),
  z.object({
    action: z.literal('ubah'),
    nama: z.string().trim().min(3).max(200),
    jk: z.enum(['Laki-Laki', 'Perempuan']),
    nik: z.string().trim().max(20).optional().nullable(),
    email: z.string().trim().toLowerCase().email().max(100).optional().nullable().or(z.literal('')),
    noHp: z.string().trim().max(20).optional().nullable(),
    programId: z.coerce.number().int().positive(),
    status: z.enum(KIAS_STATUS_SANTRI),
  }),
])

async function findSantri(kode: string) {
  return prisma.kiasSantri.findUnique({ where: { kodeRegistrasi: kode }, include: { user: { select: { id: true, email: true } } } })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const santri = await findSantri((await params).kode)
  if (!santri) return Response.json(fail('Pendaftar tidak ditemukan'), { status: 404 })

  const parsed = actionSchema.safeParse(await req.json())
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const i of parsed.error.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }
  const a = parsed.data

  switch (a.action) {
    case 'terima':
      await prisma.kiasSantri.update({
        where: { id: santri.id },
        data: { statusPendaftaran: 'Diterima', statusTransfer: 'Valid', tglVerifikasi: new Date(), alasanPenolakan: null },
      })
      if (santri.user) await prisma.user.update({ where: { id: santri.user.id }, data: { isActive: true } })
      await notifyKiasSantri(santri.id, 'diterima', 'Pendaftaran Diterima',
        'Selamat! Pendaftaran Anda telah diterima. Silakan tunggu informasi selanjutnya mengenai tes masuk.')
      return Response.json(ok(null, 'Pendaftar diterima'))

    case 'tolak':
      await prisma.kiasSantri.update({ where: { id: santri.id }, data: { statusPendaftaran: 'Ditolak', alasanPenolakan: a.alasan } })
      await notifyKiasSantri(santri.id, 'ditolak', 'Pendaftaran Ditolak', `Maaf, pendaftaran Anda ditolak. Alasan: ${a.alasan}`)
      return Response.json(ok(null, 'Pendaftar ditolak'))

    case 'transfer': {
      if (a.status === 'Invalid' && !a.alasan) {
        return Response.json(fail('Data tidak valid', { alasan: ['Alasan wajib diisi untuk transfer tidak valid'] }), { status: 422 })
      }
      await prisma.kiasSantri.update({
        where: { id: santri.id },
        data: { statusTransfer: a.status, alasanPenolakan: a.status === 'Invalid' ? a.alasan : null },
      })
      if (a.status === 'Valid' && santri.user) await prisma.user.update({ where: { id: santri.user.id }, data: { isActive: true } })
      if (a.status !== 'Cek') {
        await notifyKiasSantri(
          santri.id,
          'pembayaran',
          a.status === 'Valid' ? 'Pembayaran Terverifikasi' : 'Bukti Pembayaran Tidak Valid',
          a.status === 'Valid'
            ? 'Pembayaran pendaftaran Anda sudah kami terima. Silakan bergabung ke grup melalui dashboard.'
            : `Bukti pembayaran Anda belum dapat kami terima. Alasan: ${a.alasan}. Silakan unggah ulang di dashboard.`,
        )
      }
      return Response.json(ok(null, `Status transfer: ${a.status}`))
    }

    case 'notifikasi-wa':
      await prisma.kiasSantri.update({ where: { id: santri.id }, data: { kirimNotifikasi: true } })
      return Response.json(ok(null))

    case 'ubah': {
      const email = a.email || null
      if (email && santri.user && email !== santri.user.email) {
        const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } })
        if (taken) return Response.json(fail('Data tidak valid', { email: ['Email sudah dipakai akun lain'] }), { status: 422 })
      }
      const noHp = a.noHp ? normalizeNoHp(a.noHp) : santri.noHp
      await prisma.$transaction([
        prisma.kiasSantri.update({
          where: { id: santri.id },
          data: {
            nama: a.nama, jk: a.jk, nik: a.nik || null, email, programId: a.programId, status: a.status,
            noHp, hp: noHp ? `62${noHp}` : santri.hp,
          },
        }),
        ...(santri.user
          ? [prisma.user.update({ where: { id: santri.user.id }, data: { nama: a.nama, ...(email ? { email } : {}) } })]
          : []),
      ])
      return Response.json(ok(null, 'Data pendaftar diperbarui'))
    }
  }
}

/** Hapus pendaftar beserta akun santri, notifikasi, dan berkas (sama dengan KIAS lama). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const santri = await findSantri((await params).kode)
  if (!santri) return Response.json(fail('Pendaftar tidak ditemukan'), { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.kiasNotification.deleteMany({ where: { kiasSantriId: santri.id } })
    if (santri.user) {
      const u = await tx.user.findUnique({ where: { id: santri.user.id }, select: { roleId: true, siswaId: true } })
      // Akun yang juga terdaftar HKI atau milik admin tidak dihapus, hanya dilepas dari KIAS.
      if (u && u.roleId >= 3 && !u.siswaId) {
        await tx.kiasNotification.deleteMany({ where: { userId: santri.user.id } })
        await tx.user.delete({ where: { id: santri.user.id } })
      } else {
        await tx.user.update({ where: { id: santri.user.id }, data: { kiasSantriId: null } })
      }
    }
    await tx.kiasSantri.delete({ where: { id: santri.id } })
  })
  await removeKiasDir(santri.tahunPsb, santri.kodeRegistrasi)
  return Response.json(ok(null, 'Pendaftar dihapus'))
}
