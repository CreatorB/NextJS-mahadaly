import { NextRequest } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { profilSchema } from '@/lib/validations/profil'
import { getProfil, sanitizeProfilKonten, saveProfil } from '@/lib/profil'

export const dynamic = 'force-dynamic'

/** Ambil profil singleton untuk form admin. */
export async function GET(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const profil = await getProfil()
  return Response.json(ok(profil))
}

/** Simpan profil (upsert baris singleton). */
export async function PUT(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session || session.roleId > 2) return Response.json(fail('Unauthorized'), { status: 401 })

  const parsed = profilSchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json(
      fail('Data tidak valid', parsed.error.flatten().fieldErrors as Record<string, string[]>),
      { status: 422 },
    )
  }

  const d = parsed.data
  const saved = await saveProfil({
    konten: sanitizeProfilKonten(d.konten),
    videoUrl: d.videoUrl || null,
    updatedById: session.userId,
  })

  return Response.json(ok(saved, 'Profil tersimpan'))
}

/** Hapus? Sengaja tidak ada — tabel singleton, isi selalu bisa diganti admin. */
export async function DELETE() {
  return Response.json(fail('Profil tidak bisa dihapus'), { status: 400 })
}
