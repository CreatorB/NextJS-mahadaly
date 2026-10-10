import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { ok, fail } from '@/types/api'
import { getActiveKiasInfo, isKiasPsbOpen } from '@/lib/kias'
import { KIAS_MANUAL_COOKIE, KIAS_MANUAL_TTL_SECONDS, signKiasManualToken } from '@/lib/kias-manual'

export const dynamic = 'force-dynamic'

/** Verifikasi password pendaftaran manual → cookie 10 menit. */
export async function POST(req: NextRequest) {
  const info = await getActiveKiasInfo()
  if (!info?.manualPassword) return NextResponse.json(fail('Pendaftaran manual tidak aktif.'), { status: 403 })
  if (!isKiasPsbOpen(info)) return NextResponse.json(fail('Pendaftaran sudah ditutup.'), { status: 400 })

  const body = (await req.json().catch(() => ({}))) as { password?: string }
  if (!body.password || !(await bcrypt.compare(body.password, info.manualPassword))) {
    return NextResponse.json(fail('Password salah.'), { status: 401 })
  }

  const res = NextResponse.json(ok(null, 'Password benar.'))
  res.cookies.set(KIAS_MANUAL_COOKIE, await signKiasManualToken(info.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: KIAS_MANUAL_TTL_SECONDS,
    path: '/',
  })
  return res
}
