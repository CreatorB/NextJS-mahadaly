import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

const slugRegex = /^[a-z0-9-]{3,50}$/

const createSchema = z.object({
  slug: z.string().regex(slugRegex, 'Slug hanya huruf kecil, angka, dan dash (3-50 karakter)'),
  label: z.string().min(1, 'Label wajib diisi').max(200),
  quota: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional().default(true),
})

export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const links = await prisma.registrationLink.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, nama: true, email: true } },
      _count: { select: { pendaftarans: true } },
    },
  })

  return Response.json(ok(links))
}

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json(fail('Body harus JSON'), { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    }
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }

  const { slug, label, quota, expiresAt, isActive } = parsed.data
  const quotaValue = quota ?? null
  const expiresAtValue = expiresAt ? new Date(expiresAt) : null

  const existing = await prisma.registrationLink.findUnique({ where: { slug } })
  if (existing) {
    return Response.json(fail('Slug sudah dipakai', { slug: ['Slug ini sudah ada, gunakan slug lain'] }), { status: 409 })
  }

  try {
    const link = await prisma.registrationLink.create({
      data: {
        slug,
        label,
        quota: quotaValue,
        expiresAt: expiresAtValue,
        isActive: isActive ?? true,
        createdById: session.userId,
      },
    })
    return Response.json(ok(link), { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json(fail('Gagal membuat link', { _form: [msg] }), { status: 500 })
  }
}
