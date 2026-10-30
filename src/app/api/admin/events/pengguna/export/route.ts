import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { RESET_REQUEST_TYPE } from '@/lib/password-reset'
import {
  csvText,
  downloadHeaders,
  excelXml,
  exportFileName,
  formatContactName,
  vcfText,
  type VCardInput,
} from '@/lib/export'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const tglJam = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' }) : ''

const AKUN_LABEL: Record<string, string> = {
  event: 'Peserta Event',
  santri: 'Santri PSB',
  kias: 'Santri KIAS',
  akun: 'Akun biasa',
}

function jenisAkun(u: { roleId: number; kiasSantriId: number | null; siswaId: number | null }): string {
  if (u.roleId === 4) return 'event'
  if (u.roleId === 3) return u.kiasSantriId && !u.siswaId ? 'kias' : 'santri'
  return 'akun'
}

/**
 * Export daftar pengguna (akun peserta event / Santri PSB / Santri KIAS).
 * Menghormati filter ?q= (cari nama/email) dan ?type= (jenis akun).
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') ?? 'xls').toLowerCase()
  const q = sp.get('q') ?? ''
  const type = sp.get('type') ?? ''
  const prefix = (sp.get('prefix') ?? '').trim()
  const tahunParam = (sp.get('tahun') ?? '').trim()

  const where: Record<string, unknown> = {}
  if (q) where.OR = [{ nama: { contains: q } }, { email: { contains: q } }]
  if (type && type !== 'all') {
    if (type === 'event') where.eventRegistrations = { some: {} }
    else if (type === 'santri') where.siswaId = { not: null }
    else if (type === 'kias') where.kiasSantriId = { not: null }
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      role: { select: { namaRole: true } },
      eventRegistrations: { include: { event: { select: { title: true, slug: true, startDate: true } } } },
      siswa: { select: { noHp: true, kodeNegara: true } },
      kiasSantri: { select: { noHp: true, kodeNegara: true } },
      resetTokens: { where: { type: RESET_REQUEST_TYPE, usedAt: null }, take: 1 },
    },
  })

  const now = Date.now()
  const info = users.map((u) => {
    const reg = u.eventRegistrations[0]
    const tel =
      reg?.phone ||
      (u.siswa?.noHp ? `+${u.siswa.kodeNegara || '62'}${u.siswa.noHp}` : '') ||
      (u.kiasSantri?.noHp ? `+${u.kiasSantri.kodeNegara || '62'}${u.kiasSantri.noHp}` : '')
    return {
      nama: u.nama,
      email: u.email,
      akun: jenisAkun(u),
      akunLabel: AKUN_LABEL[jenisAkun(u)],
      roleName: u.role.namaRole,
      isActive: u.isActive,
      eventCount: u.eventRegistrations.length,
      eventList: u.eventRegistrations.map((r) => r.event.title),
      adaRequest: u.resetTokens.some((t) => t.expiresAt.getTime() > now),
      createdAt: u.createdAt,
      passwordChangedAt: u.passwordChangedAt,
      tel,
      eventTitle: reg?.event.title ?? '',
      eventSlug: reg?.event.slug ?? '',
      eventYear: reg ? String(reg.event.startDate.getFullYear()) : String(new Date().getFullYear()),
    }
  })

  /* ------------------------------------------------------------- vCard */
  if (format === 'vcf') {
    const cards: VCardInput[] = info.map((u) => ({
      nama: u.nama,
      displayName: formatContactName(u.nama, {
        prefix,
        tahun: tahunParam || u.eventYear,
      }),
      telepon: u.tel,
      email: u.email,
      org: u.eventTitle || u.akunLabel,
      nickname: u.eventSlug || u.akunLabel,
      catatan: `${u.akunLabel} · ${u.roleName}${u.isActive ? '' : ' · Nonaktif'}`,
    }))
    return new Response(vcfText(cards), {
      status: 200,
      headers: downloadHeaders(exportFileName('kontak-pengguna', 'vcf'), 'text/x-vcard; charset=utf-8'),
    })
  }

  const header = [
    'Nama', 'Email', 'Jenis Akun', 'Role', 'Status', 'No HP', 'Jumlah Event',
    'Daftar Event', 'Request Reset', 'Akun Dibuat', 'Password Diubah',
  ]
  const rows = info.map((u) => [
    u.nama,
    u.email,
    u.akunLabel,
    u.roleName,
    u.isActive ? 'Aktif' : 'Nonaktif',
    u.tel,
    u.eventCount,
    u.eventList.join(' | '),
    u.adaRequest ? 'Ya' : 'Tidak',
    tglJam(u.createdAt),
    tglJam(u.passwordChangedAt),
  ])

  if (format === 'csv') {
    return new Response(csvText(header, rows), {
      status: 200,
      headers: downloadHeaders(exportFileName('daftar-pengguna', 'csv'), 'text/csv; charset=utf-8'),
    })
  }

  return new Response(excelXml('Daftar Pengguna', header, rows), {
    status: 200,
    headers: downloadHeaders(exportFileName('daftar-pengguna', 'xls'), 'application/vnd.ms-excel; charset=utf-8'),
  })
}
