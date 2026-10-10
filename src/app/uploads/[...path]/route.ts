import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import { verifyTokenFromRequest } from '@/lib/auth'
import { canAccessUpload, isPublicUpload, resolveUploadPath, UPLOAD_MIME, warnUnsafeUploadDir } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * Semua file upload lewat sini. Gambar berita publik; berkas pendaftar hanya untuk admin
 * atau pemiliknya, dan tidak boleh di-cache CDN (Cloudflare) karena berisi data pribadi.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  warnUnsafeUploadDir()
  const { path: parts } = await params
  const filePath = resolveUploadPath(parts)
  if (!filePath) return new Response('Not found', { status: 404 })

  const isPublic = isPublicUpload(parts)
  if (!isPublic) {
    const session = await verifyTokenFromRequest(req)
    if (!session) return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
    if (!(await canAccessUpload(session, parts))) {
      return new Response('Forbidden', { status: 403, headers: { 'Cache-Control': 'no-store' } })
    }
  }

  try {
    const buffer = await fs.readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    return new Response(buffer, {
      headers: {
        'Content-Type': UPLOAD_MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
