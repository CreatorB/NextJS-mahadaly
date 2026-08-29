import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

const slugRegex = /^[a-z0-9-]{3,50}$/

const patchSchema = z.object({
  slug: z.string().regex(slugRegex).optional(),
  label: z.string().min(1).max(200).optional(),
  quota: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { id } = await params
  const linkId = parseInt(id)
  if (!Number.isFinite(linkId)) return Response.json(fail('ID tidak valid'), { status: 400 })

  const existing = await prisma.registrationLink.findUnique({ where: { id: linkId } })
  if (!existing) return Response.json(fail('Link tidak ditemukan'), { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json(fail('Body harus JSON'), { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    }
    return Response.json(fail('Data tidak valid', errors), { status: 422 })
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.registrationLink.findUnique({ where: { slug: parsed.data.slug } })
    if (clash) return Response.json(fail('Slug sudah dipakai', { slug: ['Slug ini sudah ada'] }), { status: 409 })
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug
  if (parsed.data.label !== undefined) data.label = parsed.data.label
  if (parsed.data.quota !== undefined) data.quota = parsed.data.quota ?? null
  if (parsed.data.expiresAt !== undefined) {
    data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
  }
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

  const updated = await prisma.registrationLink.update({ where: { id: linkId }, data })
  return Response.json(ok(updated))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const { id } = await params
  const linkId = parseInt(id)
  if (!Number.isFinite(linkId)) return Response.json(fail('ID tidak valid'), { status: 400 })

  const existing = await prisma.registrationLink.findUnique({ where: { id: linkId } })
  if (!existing) return Response.json(fail('Link tidak ditemukan'), { status: 404 })

  const used = await prisma.santri.count({ where: { registrationLinkId: linkId } })
  if (used > 0) {
    await prisma.registrationLink.update({ where: { id: linkId }, data: { isActive: false } })
    return Response.json(fail(`Link sudah dipakai ${used} pendaftar, tidak bisa dihapus. Dinonaktifkan saja.`, { _form: [`Used by ${used} pendaftar`] }), { status: 409 })
  }

  await prisma.registrationLink.delete({ where: { id: linkId } })
  return Response.json(ok({ deleted: true }))
}
