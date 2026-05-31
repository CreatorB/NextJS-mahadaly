import { getSession } from '@/lib/auth'
import { ok, fail } from '@/types/api'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })
  return Response.json(ok(session))
}
