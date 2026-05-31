import { clearSession } from '@/lib/auth'
import { ok } from '@/types/api'

export async function POST() {
  await clearSession()
  return Response.json(ok(null, 'Berhasil logout'))
}
