import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/types/api'
import { findValidResetToken, setUserPassword, consumeToken } from '@/lib/password-reset'

export const dynamic = 'force-dynamic'

const schema = z
  .object({
    token: z.string().min(10, 'Link reset password tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    passwordConfirm: z.string().min(1, 'Ulangi password wajib diisi'),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Konfirmasi password tidak cocok',
  })

/** Buat password baru dari link reset (token sekali pakai, berlaku 24 jam). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    for (const i of parsed.error.issues) errors[i.path.join('.')] = [...(errors[i.path.join('.')] ?? []), i.message]
    return Response.json(fail('Data tidak valid', errors), { status: 400 })
  }

  const record = await findValidResetToken(parsed.data.token)
  if (!record) {
    return Response.json(fail('Link reset password tidak valid atau sudah kadaluarsa. Minta link baru ke admin.'), { status: 400 })
  }

  await setUserPassword(record.userId, parsed.data.password)
  await consumeToken(record.id)

  return Response.json(ok(null, 'Password berhasil diperbarui. Silakan login dengan password baru.'))
}
