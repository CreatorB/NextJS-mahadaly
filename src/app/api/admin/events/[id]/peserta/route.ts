import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { eventErrors } from '@/lib/events-admin'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const opt = z.string().trim().max(255).optional().nullable().transform((v) => v || null)

const actionSchema = z.discriminatedUnion('action', [
  // Tambah peserta oleh panitia (langsung valid).
  z.object({
    action: z.literal('tambah'),
    name: z.string().trim().min(2).max(255),
    phone: z.string().trim().min(6).max(20),
    email: z.string().trim().toLowerCase().email().max(255),
    gender: z.enum(['Laki-Laki', 'Perempuan']),
    address: opt, occupation: opt,
  }),
  z.object({ action: z.literal('status'), registrationId: z.number().int(), paymentStatus: z.enum(['pending', 'valid', 'invalid']) }),
  z.object({ action: z.literal('hapus'), registrationId: z.number().int() }),
  // Absensi hari ini (sama dengan KIAS lama: satu catatan per hari).
  z.object({ action: z.literal('hadir'), registrationId: z.number().int(), hadir: z.boolean() }),
])

function today() {
  const now = new Date()
  // Batas hari menurut WIB (UTC+7).
  const wib = new Date(now.getTime() + 7 * 3600000)
  const start = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - 7 * 3600000)
  return { start, end: new Date(start.getTime() + 86400000) }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const eventId = Number((await params).id)
  const parsed = actionSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json(fail('Data tidak valid', eventErrors(parsed.error)), { status: 422 })
  const a = parsed.data

  if (a.action === 'tambah') {
    const user = await prisma.user.findUnique({ where: { email: a.email }, select: { id: true } })
    if (user && (await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } }))) {
      return Response.json(fail('Data tidak valid', { email: ['Peserta dengan email ini sudah terdaftar'] }), { status: 422 })
    }
    const r = await prisma.eventRegistration.create({
      data: {
        eventId, userId: user?.id ?? null, name: a.name, phone: a.phone, email: a.email, gender: a.gender,
        address: a.address, occupation: a.occupation, paymentStatus: 'valid',
      },
    })
    return Response.json(ok({ id: r.id }, 'Peserta ditambahkan'), { status: 201 })
  }

  const reg = await prisma.eventRegistration.findFirst({ where: { id: a.registrationId, eventId } })
  if (!reg) return Response.json(fail('Peserta tidak ditemukan'), { status: 404 })

  if (a.action === 'status') {
    await prisma.eventRegistration.update({ where: { id: reg.id }, data: { paymentStatus: a.paymentStatus } })
    return Response.json(ok(null, 'Status diperbarui'))
  }
  if (a.action === 'hapus') {
    await prisma.$transaction(async (tx) => {
      await tx.eventRegistration.delete({ where: { id: reg.id } })
      if (reg.internalLinkId) {
        const male = reg.gender === 'Laki-Laki'
        await tx.eventInternalLink.updateMany({
          where: { id: reg.internalLinkId, ...(male ? { usageIkhwan: { gt: 0 } } : { usageAkhwat: { gt: 0 } }) },
          data: male ? { usageIkhwan: { decrement: 1 } } : { usageAkhwat: { decrement: 1 } },
        })
      }
    })
    return Response.json(ok(null, 'Peserta dihapus'))
  }

  const { start, end } = today()
  const existing = await prisma.eventAttendance.findFirst({ where: { registrationId: reg.id, attendedAt: { gte: start, lt: end } } })
  if (a.hadir && !existing) await prisma.eventAttendance.create({ data: { registrationId: reg.id } })
  if (!a.hadir && existing) await prisma.eventAttendance.deleteMany({ where: { registrationId: reg.id, attendedAt: { gte: start, lt: end } } })
  return Response.json(ok({ hadir: a.hadir }))
}
