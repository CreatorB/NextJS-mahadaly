import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail, ok } from '@/types/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/absen/password
 * Pegawai mengganti password sendiri (password awal = 123456).
 * Mengganti password akan memaksa sesi di perangkat lain untuk login ulang.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session) return Response.json(fail('Sesi tidak valid.'), { status: 401 })

    const body = (await req.json().catch(() => ({}))) as {
      passwordSaatIni?: string
      passwordBaru?: string
    }

    const lama = body.passwordSaatIni ?? ''
    const baru = body.passwordBaru ?? ''

    if (!lama) return Response.json(fail('Password saat ini wajib diisi.'), { status: 400 })
    if (baru.length < 6) {
      return Response.json(fail('Password baru minimal 6 karakter.'), { status: 400 })
    }
    if (baru.length > 100) {
      return Response.json(fail('Password baru terlalu panjang.'), { status: 400 })
    }
    if (lama === baru) {
      return Response.json(fail('Password baru harus berbeda dari password lama.'), { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, password: true },
    })
    if (!user) return Response.json(fail('Akun tidak ditemukan.'), { status: 404 })

    const cocok = await bcrypt.compare(lama, user.password)
    if (!cocok) {
      return Response.json(fail('Password saat ini salah.'), { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(baru, 10),
        passwordChangedAt: new Date(),
      },
    })

    return Response.json(ok(null, 'Password berhasil diubah. Silakan login ulang di perangkat lain.'))
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan saat mengganti password.'), { status: 500 })
  }
}
