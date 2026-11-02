import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requireAdminApi } from '@/lib/kias-admin'
import { fail, ok } from '@/types/api'
import { bacaXlsx, susunDataPegawai } from '@/lib/import-pegawai-helper'
import { PASSWORD_DEFAULT_PEGAWAI, ROLE_ID_PEGAWAI } from '@/lib/pegawai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAKS_UKURAN = 10 * 1024 * 1024

/**
 * POST /api/admin/pegawai/import
 * Unggah file Excel (.xlsx) data pegawai -> baca -> upsert ke database.
 * Akun login dibuat otomatis bila belum ada (password awal 123456).
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  try {
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return Response.json(fail('File Excel belum dipilih.'), { status: 400 })
    }
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return Response.json(fail('File Excel belum dipilih.'), { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) {
      return Response.json(fail('File kosong.'), { status: 400 })
    }
    if (buffer.length > MAKS_UKURAN) {
      return Response.json(fail('Ukuran file maksimal 10 MB.'), { status: 400 })
    }

    const { baris, header, indeks } = bacaXlsx(buffer)
    if (!header) {
      return Response.json(
        fail('Header kolom tidak dikenali. Pastikan file memuat kolom nama pegawai.'),
        { status: 400 },
      )
    }

    const { data, catatan } = susunDataPegawai(baris, header, indeks)

    if (data.length === 0) {
      return Response.json(fail('Tidak ada data pegawai yang bisa dibaca dari file.'), { status: 400 })
    }

    let dibuat = 0
    let diperbarui = 0
    let akunBaru = 0

    for (const d of data) {
      const lama = await prisma.pegawai.findFirst({
        where: d.nik ? { OR: [{ nik: d.nik }, { nama: d.nama }] } : { nama: d.nama },
      })

      // Jam kerja manual adalah pengaturan admin, bukan data Excel.
      // Kalau Excel tidak menyertakan kolom jam kerja, pengaturan lama dipertahankan.
      const jamKerja = lama
        ? {
            jamMasuk: lama.jamMasuk,
            jamPulang: lama.jamPulang,
            toleransiMenit: lama.toleransiMenit,
          }
        : { jamMasuk: null, jamPulang: null, toleransiMenit: null }

      const pegawai = lama
        ? await prisma.pegawai.update({ where: { id: lama.id }, data: { ...d, ...jamKerja } })
        : await prisma.pegawai.create({ data: { ...d, ...jamKerja } })

      if (lama) diperbarui++
      else dibuat++

      if (!pegawai.userId) {
        const emailDiminta = d.email
        let userId: number | null = null

        if (emailDiminta) {
          const userAda = await prisma.user.findUnique({ where: { email: emailDiminta } })
          if (userAda && userAda.roleId === ROLE_ID_PEGAWAI) {
            userId = userAda.id
            await prisma.user.update({
              where: { id: userAda.id },
              data: { nama: d.nama, isActive: true },
            })
          }
        }

        if (!userId) {
          const emailInternal = `pegawai-${pegawai.id}@mahadaly.syathiby.id`
          const bentrok = await prisma.user.findUnique({ where: { email: emailInternal } })
          if (bentrok && bentrok.roleId === ROLE_ID_PEGAWAI) {
            userId = bentrok.id
          } else {
            const user = await prisma.user.create({
              data: {
                nama: d.nama,
                email: emailInternal,
                password: await bcrypt.hash(PASSWORD_DEFAULT_PEGAWAI, 10),
                roleId: ROLE_ID_PEGAWAI,
                isActive: true,
              },
            })
            userId = user.id
            akunBaru++
            if (!emailDiminta) {
              catatan.push(`${d.nama}: tanpa email -> akun dibuat dengan ${emailInternal}.`)
            }
          }
        }

        if (userId) {
          await prisma.pegawai.update({ where: { id: pegawai.id }, data: { userId } })
        }
      }
    }

    await prisma.riwayatImportPegawai.create({
      data: {
        sumber: (file as File).name ?? 'upload.xlsx',
        jumlahPegawai: data.length,
        jumlahBaru: dibuat,
        jumlahUpdate: diperbarui,
        catatan: catatan.length ? catatan.join('\n') : null,
      },
    })

    return Response.json(
      ok(
        { total: data.length, baru: dibuat, diperbarui, akunBaru, catatan },
        `Import selesai: ${data.length} pegawai (${dibuat} baru, ${diperbarui} diperbarui).`,
      ),
    )
  } catch (e) {
    console.error(e)
    const pesan = e instanceof Error ? e.message : 'Gagal memproses file.'
    return Response.json(fail(`Gagal memproses file: ${pesan}`), { status: 400 })
  }
}
