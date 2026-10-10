import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { KIAS_BERKAS_FIELDS, KIAS_MIME, resolveKiasBerkas, type KiasBerkasField } from '@/lib/kias-berkas'

export const dynamic = 'force-dynamic'

/** Berkas pendaftar KIAS — hanya admin atau pemilik akun. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ kode: string; field: string }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { kode, field } = await params
  if (!KIAS_BERKAS_FIELDS.includes(field as KiasBerkasField)) return new Response('Not found', { status: 404 })

  const santri = await prisma.kiasSantri.findUnique({ where: { kodeRegistrasi: kode }, include: { user: { select: { id: true } } } })
  if (!santri) return new Response('Not found', { status: 404 })
  if (session.roleId > 2 && santri.user?.id !== session.userId) return new Response('Forbidden', { status: 403 })

  const filename = santri[field as KiasBerkasField]
  if (!filename) return new Response('Not found', { status: 404 })
  const filePath = resolveKiasBerkas(santri.tahunPsb, santri.kodeRegistrasi, filename)
  if (!filePath) return new Response('Not found', { status: 404 })

  try {
    const buffer = await fs.readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    return new Response(buffer, {
      headers: { 'Content-Type': KIAS_MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
