import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'
import { canAccessUpload, resolveUploadPath, UPLOAD_MIME } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const { path: parts } = await params
  const filePath = resolveUploadPath(parts)
  if (!filePath || !(await canAccessUpload(session, parts))) {
    return Response.json(fail('Forbidden'), { status: 403 })
  }

  try {
    const buffer = await fs.readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
    return new Response(buffer, {
      headers: { 'Content-Type': UPLOAD_MIME[ext] ?? 'application/octet-stream', 'Cache-Control': 'private, no-store' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
