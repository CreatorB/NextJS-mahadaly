import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ok, fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'

export const dynamic = 'force-dynamic'

const num = z.coerce.number().int().min(0)
const optNum = z.union([z.literal(''), z.null(), z.coerce.number().int().min(0)]).optional().transform((v) => (v === '' || v == null ? null : v))
const optDate = z.string().optional().nullable().transform((v) => (v ? new Date(v) : null))

const infoSchema = z
  .object({
    id: z.coerce.number().int().positive().optional(),
    tahunAjaran: z.string().trim().regex(/^\d{4}-\d{4}$/, 'Format tahun ajaran: 2026-2027'),
    statusPsb: z.enum(['Buka', 'Tutup']),
    datetimeOpen: optDate,
    datetimeClosed: optDate,
    quotaIkhwan: optNum,
    quotaAkhwat: optNum,
    biayaPendaftaran: num,
    biayaSaranaPrasarana: num,
    biayaKuliahPerdana: num,
    biayaSppBulanan: num,
    linkGroup: z.string().trim().url('Link grup harus URL').max(500).optional().or(z.literal('')).transform((v) => v || null),
    kontenPsb: z.string().optional().nullable(),
    /** kosong = tidak diubah; "-" = nonaktifkan pendaftaran manual */
    manualPassword: z.string().optional(),
  })
  .refine((d) => !d.datetimeOpen || !d.datetimeClosed || d.datetimeClosed >= d.datetimeOpen, {
    path: ['datetimeClosed'],
    message: 'Tanggal tutup harus setelah tanggal buka',
  })

/** Simpan info PSB KIAS (buat baru bila tanpa id). */
export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const parsed = infoSchema.safeParse(await req.json())
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const i of parsed.error.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }
  const { id, manualPassword, ...d } = parsed.data
  const dup = await prisma.kiasInfoPsb.findUnique({ where: { tahunAjaran: d.tahunAjaran }, select: { id: true } })
  if (dup && dup.id !== id) return Response.json(fail('Data tidak valid', { tahunAjaran: ['Tahun ajaran sudah ada'] }), { status: 422 })

  let manual: { manualPassword?: string | null } = {}
  if (manualPassword === '-') manual = { manualPassword: null }
  else if (manualPassword && manualPassword.length >= 4) manual = { manualPassword: await bcrypt.hash(manualPassword, 10) }
  else if (manualPassword) return Response.json(fail('Data tidak valid', { manualPassword: ['Minimal 4 karakter'] }), { status: 422 })

  const saved = id
    ? await prisma.kiasInfoPsb.update({ where: { id }, data: { ...d, ...manual } })
    : await prisma.kiasInfoPsb.create({ data: { ...d, ...manual } })
  return Response.json(ok({ id: saved.id }, 'Pengaturan PSB KIAS tersimpan'))
}

/** Ubah status kelas: { programId, statusPsb } */
export async function PATCH(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const body = z.object({ programId: z.coerce.number().int(), statusPsb: z.enum(['Buka', 'Tutup']) }).safeParse(await req.json())
  if (!body.success) return Response.json(fail('Data tidak valid'), { status: 422 })
  await prisma.kiasProgram.update({ where: { id: body.data.programId }, data: { statusPsb: body.data.statusPsb } })
  return Response.json(ok(null, 'Status kelas diperbarui'))
}
