import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

/**
 * Pendaftaran KIAS manual (dibantu admin di lokasi): dibuka dengan password `manual_password`
 * di info PSB, berlaku 10 menit seperti KIAS lama. Mode manual tidak dibatasi kuota.
 */
export const KIAS_MANUAL_COOKIE = 'kias_manual'
export const KIAS_MANUAL_TTL_SECONDS = 10 * 60

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signKiasManualToken(infoPsbId: number) {
  return new SignJWT({ scope: 'kias-manual', infoPsbId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${KIAS_MANUAL_TTL_SECONDS}s`)
    .sign(secret)
}

/** true bila cookie manual valid untuk info PSB yang sedang aktif. */
export async function isKiasManualVerified(infoPsbId: number, token?: string | null) {
  const value = token ?? (await cookies()).get(KIAS_MANUAL_COOKIE)?.value
  if (!value) return false
  try {
    const { payload } = await jwtVerify(value, secret)
    return payload.scope === 'kias-manual' && payload.infoPsbId === infoPsbId
  } catch {
    return false
  }
}
