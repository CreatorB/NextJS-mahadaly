import { NextRequest } from 'next/server'
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
  const { path: pathParts } = await params
  const filePath = path.join(UPLOAD_BASE, ...pathParts)

  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(UPLOAD_BASE))) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const buffer = await fs.readFile(resolved)
    const ext = pathParts[pathParts.length - 1].split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream'
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}