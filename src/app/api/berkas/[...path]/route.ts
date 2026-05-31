import { NextRequest } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? './uploads'

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const { path: pathParts } = await params
  const filePath = path.join(UPLOAD_BASE, ...pathParts)

  try {
    const buffer = await fs.readFile(filePath)
    const ext = pathParts[pathParts.length - 1].split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream'
    return new Response(buffer, { headers: { 'Content-Type': contentType } })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
