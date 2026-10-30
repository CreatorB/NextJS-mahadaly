import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { PAYMENT_STATUS_LABEL } from '@/lib/events'
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

const tglJam = (d: Date | null) => (d ? d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' }) : '')
const tgl = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

/**
 * Export peserta satu event.
 *
 * ?format=xls|csv → daftar peserta (menghormati filter q / gender / status)
 * ?format=vcf     → kontak peserta (dukung ?prefix= &tahun=)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })
  const id = Number((await params).id)
  const event = await prisma.event.findUnique({ where: { id }, select: { slug: true, title: true, startDate: true } })
  if (!event) return Response.json(fail('Event tidak ditemukan'), { status: 404 })

  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') ?? 'csv').toLowerCase()
  const q = sp.get('q') ?? ''
  const gender = sp.get('gender') ?? ''
  const status = sp.get('status') ?? ''
  const prefix = (sp.get('prefix') ?? '').trim()
  const tahunParam = (sp.get('tahun') ?? '').trim()

  const where = {
    eventId: id,
    ...(gender ? { gender } : {}),
    ...(status ? { paymentStatus: status } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
  }

  const regs = await prisma.eventRegistration.findMany({
    where,
    orderBy: { registeredAt: 'asc' },
    include: { attendances: { orderBy: { attendedAt: 'asc' } }, internalLink: { select: { name: true } } },
  })

  /* ------------------------------------------------------------- vCard */
  if (format === 'vcf') {
    const cards: VCardInput[] = regs.map((r) => ({
      nama: r.name,
      displayName: formatContactName(r.name, {
        prefix,
        tahun: tahunParam || String(event.startDate.getFullYear()),
      }),
      telepon: r.phone,
      email: r.email,
      org: event.title,
      nickname: event.slug,
      catatan: [
        `Status: ${PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus}`,
        r.internalLink ? `Jalur: Internal ${r.internalLink.name}` : 'Jalur: Publik',
      ].join(' | '),
    }))
    return new Response(vcfText(cards), {
      status: 200,
      headers: downloadHeaders(
        exportFileName(`kontak-${event.slug}`, 'vcf'),
        'text/x-vcard; charset=utf-8',
      ),
    })
  }

  const header = ['No', 'Nama', 'Jenis Kelamin', 'No HP', 'Email', 'Alamat', 'Tempat Lahir', 'Tanggal Lahir', 'Pekerjaan', 'Status', 'Jalur', 'Tgl Daftar', 'Jumlah Hadir', 'Waktu Hadir']
  const rows = regs.map((r, i) => [
    i + 1, r.name, r.gender, r.phone, r.email, r.address ?? '', r.birthPlace ?? '', tgl(r.birthDate), r.occupation ?? '',
    PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus, r.internalLink ? `Internal: ${r.internalLink.name}` : 'Publik',
    tglJam(r.registeredAt), r.attendances.length, r.attendances.map((a) => tglJam(a.attendedAt)).join('; '),
  ])

  if (format === 'xls') {
    return new Response(excelXml(`Peserta ${event.slug}`, header, rows), {
      status: 200,
      headers: downloadHeaders(
        exportFileName(`peserta-${event.slug}`, 'xls'),
        'application/vnd.ms-excel; charset=utf-8',
      ),
    })
  }

  return new Response(csvText(header, rows), {
    status: 200,
    headers: downloadHeaders(exportFileName(`peserta-${event.slug}`, 'csv'), 'text/csv; charset=utf-8'),
  })
}
