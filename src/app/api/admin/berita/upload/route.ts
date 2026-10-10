import { NextRequest } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { saveBeritaImage, uploadUrl } from '@/lib/berita'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return Response.json(fail('File gambar wajib diisi'), { status: 422 })

  try {
    const path = await saveBeritaImage(file, 'posts')
    return Response.json(ok({ path, url: uploadUrl(path) }))
  } catch (e) {
    return Response.json(fail(e instanceof Error ? e.message : 'Upload gagal'), { status: 422 })
  }
}
