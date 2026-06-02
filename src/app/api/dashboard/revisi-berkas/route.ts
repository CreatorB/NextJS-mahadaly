import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { saveFile, validateImageFile, validateDocFile, getPublicUrl, getFilePath, deleteFile } from '@/lib/upload'
import { ok, fail } from '@/types/api'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = ['photo', 'ktp', 'transfer', 'ijazah'] as const
type DocField = typeof ALLOWED_FIELDS[number]

export async function POST(req: NextRequest) {
  const session = await verifyTokenFromRequest(req)
  if (!session) return Response.json(fail('Unauthorized'), { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { siswa: true },
  })
  if (!user?.siswa) return Response.json(fail('Data tidak ditemukan'), { status: 404 })

  const siswa = user.siswa

  if (siswa.statusPendaftaran === 'approved') {
    return Response.json(fail('Pendaftaran sudah disetujui, berkas tidak dapat diubah'), { status: 403 })
  }

  const formData = await req.formData()
  const field = formData.get('field') as string
  const file = formData.get('file') as File | null

  if (!ALLOWED_FIELDS.includes(field as DocField)) {
    return Response.json(fail('Field tidak valid'), { status: 400 })
  }

  const docField = field as DocField

  if (docField === 'transfer' && siswa.statusTransfer === 'approved') {
    return Response.json(fail('Bukti transfer sudah diverifikasi, tidak dapat diubah'), { status: 403 })
  }

  if (!file) return Response.json(fail('File wajib diupload'), { status: 400 })

  const validationError = docField === 'ijazah' ? validateDocFile(file) : validateImageFile(file)
  if (validationError) return Response.json(fail(validationError), { status: 422 })

  const oldPublicUrl = siswa[docField]
  if (oldPublicUrl) await deleteFile(getFilePath(oldPublicUrl))

  const newPath = await saveFile(file, siswa.tahunPsb, siswa.kodeRegistrasi, docField)
  const publicUrl = getPublicUrl(newPath)

  const updateData: Record<string, unknown> = { [docField]: publicUrl }

  // Reset semua status rejected ke pending saat berkas apapun direvisi
  // supaya admin tahu ada perubahan dan perlu review ulang
  if (siswa.statusTransfer === 'rejected') {
    updateData.statusTransfer = 'pending'
    updateData.alasanTransfer = null
  }
  if (siswa.statusPendaftaran === 'rejected') {
    updateData.statusPendaftaran = 'pending'
    updateData.alasanPendaftaran = null
  }

  await prisma.santri.update({ where: { id: siswa.id }, data: updateData })

  return Response.json(ok({ url: publicUrl }, 'Berkas berhasil diperbarui'))
}
