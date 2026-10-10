import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { syncInstagramAccount } from '@/lib/berita'
import { shortcodeFromUrl } from '@/lib/instagram'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

async function admin(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  return session && session.roleId <= 2 ? session : null
}

/** Ubah pengaturan akun: { isActive?, autoSync? } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await admin(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const id = Number((await params).id)
  const body = (await req.json()) as { isActive?: boolean; autoSync?: boolean }
  const data: { isActive?: boolean; autoSync?: boolean } = {}
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  if (typeof body.autoSync === 'boolean') data.autoSync = body.autoSync
  const account = await prisma.instagramAccount.update({ where: { id }, data })
  return Response.json(ok({ id: account.id, isActive: account.isActive, autoSync: account.autoSync }))
}

/**
 * POST tanpa body = sinkron sekarang.
 * POST { url } = tambah postingan manual (mis. bila sinkron otomatis gagal atau ingin menampilkan postingan lama).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await admin(req))) return Response.json(fail('Unauthorized'), { status: 401 })
  const id = Number((await params).id)
  const body = (await req.json().catch(() => ({}))) as { url?: string; postedAt?: string }

  if (body.url) {
    const shortcode = shortcodeFromUrl(body.url)
    if (!shortcode) return Response.json(fail('URL postingan Instagram tidak valid'), { status: 422 })
    const exist = await prisma.instagramPost.findUnique({ where: { accountId_shortcode: { accountId: id, shortcode } } })
    if (exist) {
      await prisma.instagramPost.update({ where: { id: exist.id }, data: { isHidden: false } })
      return Response.json(ok(null, 'Postingan sudah ada, ditampilkan kembali'))
    }
    await prisma.instagramPost.create({
      data: { shortcode, accountId: id, postedAt: body.postedAt ? new Date(body.postedAt) : new Date(), source: 'manual' },
    })
    return Response.json(ok(null, 'Postingan ditambahkan'))
  }

  const result = await syncInstagramAccount(id)
  return Response.json(result.ok ? ok(null, result.message) : fail(result.message), { status: result.ok ? 200 : 422 })
}
