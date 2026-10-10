import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { ok, fail } from '@/types/api'
import { resolveKiasBerkas, saveKiasBerkas, validateKiasImage, type KiasBerkasField } from '@/lib/kias-berkas'

export const dynamic = 'force-dynamic'

const FIELDS: { form: string; field: KiasBerkasField; label: string }[] = [
  { form: 'foto', field: 'photo', label: 'Pas foto' },
  { form: 'ktp', field: 'ktp', label: 'KTP' },
  { form: 'buktiPembayaran', field: 'transfer', label: 'Bukti pembayaran' },
]

/** Pemilik akun mengganti berkas; ditolak bila pendaftaran & pembayaran sudah diterima (sama dengan KIAS lama). */
export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Silakan login terlebih dahulu'), { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { kiasSantri: true } })
  const santri = user?.kiasSantri
  if (!santri) return Response.json(fail('Data pendaftaran KIAS tidak ditemukan'), { status: 404 })
  if (santri.statusPendaftaran === 'Diterima' && santri.statusTransfer === 'Valid') {
    return Response.json(fail('Revisi berkas tidak dapat dilakukan karena pendaftaran dan pembayaran sudah diterima.'), { status: 403 })
  }

  const form = await req.formData()
  const errors: Record<string, string[]> = {}
  const uploads: { field: KiasBerkasField; file: File }[] = []
  for (const f of FIELDS) {
    const file = form.get(f.form)
    if (!(file instanceof File) || file.size === 0) continue
    const e = validateKiasImage(file, f.label)
    if (e) errors[f.form] = [e]
    else uploads.push({ field: f.field, file })
  }
  if (Object.keys(errors).length) return Response.json(fail('Berkas tidak valid', errors), { status: 422 })
  if (!uploads.length) return Response.json(fail('Pilih minimal satu berkas untuk diganti'), { status: 422 })

  const data: Partial<Record<KiasBerkasField, string>> & { statusTransfer?: string } = {}
  for (const { field, file } of uploads) {
    const name = await saveKiasBerkas(file, santri.tahunPsb, santri.kodeRegistrasi, field)
    const old = santri[field]
    if (old && old !== name) {
      const oldPath = resolveKiasBerkas(santri.tahunPsb, santri.kodeRegistrasi, old)
      if (oldPath) await fs.unlink(oldPath).catch(() => undefined)
    }
    data[field] = name
    if (field === 'transfer') data.statusTransfer = 'Cek'
  }
  await prisma.kiasSantri.update({ where: { id: santri.id }, data })

  return Response.json(ok(null, 'Berkas berhasil diperbarui! Silakan tunggu verifikasi dari admin.'))
}
