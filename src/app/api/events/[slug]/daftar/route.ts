import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { signToken, verifyTokenFromRequest } from '@/lib/auth'
import { eventQuota, isEventRegistrationOpen, isInternalLinkAvailable, saveEventFile } from '@/lib/events'

export const dynamic = 'force-dynamic'

const opt = z.string().trim().max(255).optional().transform((v) => v || null)
const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(255),
  phone: z.string().trim().regex(/^[0-9+\-\s.]{8,20}$/, 'Nomor HP tidak valid'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(255),
  gender: z.enum(['Laki-Laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
  address: z.string().trim().max(2000).optional().transform((v) => v || null),
  birthPlace: opt,
  birthDate: z.string().optional().transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null)),
  occupation: opt,
  password: z.string().optional(),
  passwordConfirm: z.string().optional(),
  token: z.string().optional(),
})

/**
 * Daftar event. Tanpa login: buat akun peserta (role 4) dengan password dari formulir lalu login otomatis.
 * Email yang sudah punya akun WAJIB login dulu (KIAS lama mengganti password akun yang ada — celah ambil-alih akun).
 * Bila `token` diisi: jalur link internal (kuota link sendiri; event berstatus internal hanya bisa lewat sini).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event || !['published', 'internal'].includes(event.status)) return NextResponse.json(fail('Event tidak ditemukan'), { status: 404 })

  const form = await req.formData()
  const fields: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string') fields[k] = v
  const parsed = schema.safeParse(fields)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const i of parsed.error.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
    return NextResponse.json(fail('Data tidak valid', errors), { status: 422 })
  }
  const d = parsed.data

  const link = d.token ? await prisma.eventInternalLink.findFirst({ where: { token: d.token, eventId: event.id } }) : null
  if (d.token && !link) return NextResponse.json(fail('Link pendaftaran internal tidak valid'), { status: 404 })
  if (!link && event.status === 'internal') return NextResponse.json(fail('Event ini hanya bisa didaftar melalui link internal'), { status: 403 })
  if (link) {
    if (!isInternalLinkAvailable(link)) return NextResponse.json(fail('Link pendaftaran internal ini sudah tidak berlaku atau kuota link penuh.'), { status: 400 })
    if (!isInternalLinkAvailable(link, d.gender)) {
      return NextResponse.json(fail(`Mohon maaf, kuota jalur internal untuk ${d.gender === 'Laki-Laki' ? 'ikhwan' : 'akhwat'} sudah penuh.`), { status: 400 })
    }
  } else {
    if (!isEventRegistrationOpen(event)) return NextResponse.json(fail('Pendaftaran sudah ditutup atau belum dibuka.'), { status: 400 })
    const q = await eventQuota(event)
    const sisa = d.gender === 'Laki-Laki' ? q.sisaIkhwan : q.sisaAkhwat
    if (sisa !== null && sisa <= 0) {
      return NextResponse.json(fail(`Kuota untuk ${d.gender === 'Laki-Laki' ? 'ikhwan' : 'akhwat'} sudah penuh.`), { status: 400 })
    }
  }

  // Akun
  const session = await verifyTokenFromRequest(req)
  let userId: number
  let newSession: string | null = null
  if (session) {
    userId = session.userId
  } else {
    if (await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } })) {
      return NextResponse.json(fail('Data tidak valid', { email: ['Email sudah terdaftar. Silakan login terlebih dahulu, lalu daftar event.'] }), { status: 422 })
    }
    if (!d.password || d.password.length < 6) {
      return NextResponse.json(fail('Data tidak valid', { password: ['Password minimal 6 karakter'] }), { status: 422 })
    }
    if (d.password !== d.passwordConfirm) {
      return NextResponse.json(fail('Data tidak valid', { passwordConfirm: ['Konfirmasi password tidak sama'] }), { status: 422 })
    }
    const user = await prisma.user.create({
      data: { nama: d.name, email: d.email, password: await bcrypt.hash(d.password, 10), roleId: 4, isActive: true },
    })
    userId = user.id
    newSession = await signToken({ userId: user.id, roleId: 4, email: user.email, nama: user.nama })
  }

  const existing = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId } } })
  if (existing) return withSession(NextResponse.json(ok({ id: existing.id, sudahTerdaftar: true }, 'Anda sudah terdaftar di event ini')), newSession)

  let paymentProof: string | null = null
  if (event.isPaid) {
    const file = form.get('paymentProof')
    if (!(file instanceof File) || file.size === 0) {
      return withSession(NextResponse.json(fail('Data tidak valid', { paymentProof: ['Bukti pembayaran wajib diunggah'] }), { status: 422 }), newSession)
    }
    try {
      paymentProof = await saveEventFile(file, 'payments', 2 * 1024 * 1024)
    } catch (e) {
      return withSession(NextResponse.json(fail('Data tidak valid', { paymentProof: [e instanceof Error ? e.message : 'Upload gagal'] }), { status: 422 }), newSession)
    }
  }

  const reg = await prisma.$transaction(async (tx) => {
    const r = await tx.eventRegistration.create({
      data: {
        eventId: event.id, userId, internalLinkId: link?.id ?? null,
        name: d.name, phone: d.phone, email: d.email, address: d.address, gender: d.gender,
        birthPlace: d.birthPlace, birthDate: d.birthDate, occupation: d.occupation, paymentProof,
        paymentStatus: event.autoAccept ? 'valid' : 'pending',
      },
    })
    if (link) {
      const male = d.gender === 'Laki-Laki'
      await tx.eventInternalLink.update({ where: { id: link.id }, data: male ? { usageIkhwan: { increment: 1 } } : { usageAkhwat: { increment: 1 } } })
      // Jalur internal tidak mengurangi kuota publik (sama dengan KIAS lama).
      const quotaKey = male ? 'quotaIkhwan' : 'quotaAkhwat'
      if (event[quotaKey] != null) await tx.event.update({ where: { id: event.id }, data: { [quotaKey]: { increment: 1 } } })
    }
    return r
  })

  return withSession(NextResponse.json(ok({ id: reg.id }, 'Pendaftaran berhasil'), { status: 201 }), newSession)
}

function withSession(res: NextResponse, token: string | null) {
  if (token) {
    res.cookies.set('mahadaly_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
  }
  return res
}
