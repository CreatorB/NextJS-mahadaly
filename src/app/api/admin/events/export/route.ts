import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { EVENT_STATUS_LABEL, PAYMENT_STATUS_LABEL, isEventRegistrationOpen } from '@/lib/events'
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

const tgl = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '')

/**
 * Export area Event.
 *
 * ?format=xls|csv → daftar semua event
 * ?format=vcf      → kontak semua peserta event (dukung ?prefix= &tahun=)
 */
export async function GET(req: NextRequest) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })

  const sp = req.nextUrl.searchParams
  const format = (sp.get('format') ?? 'xls').toLowerCase()
  const prefix = (sp.get('prefix') ?? '').trim()
  const tahunParam = (sp.get('tahun') ?? '').trim()

  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { registrations: true, internalLinks: true } } },
  })

  /* ------------------------------------------------------------- vCard */
  if (format === 'vcf') {
    const regs = await prisma.eventRegistration.findMany({
      orderBy: { registeredAt: 'asc' },
      include: { event: { select: { title: true, slug: true, startDate: true } } },
    })
    const cards: VCardInput[] = regs.map((r) => ({
      nama: r.name,
      displayName: formatContactName(r.name, {
        prefix,
        tahun: tahunParam || String(r.event.startDate.getFullYear()),
      }),
      telepon: r.phone,
      email: r.email,
      org: r.event.title,
      nickname: r.event.slug,
      catatan: `Status: ${PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus}`,
    }))
    return new Response(vcfText(cards), {
      status: 200,
      headers: downloadHeaders(exportFileName('kontak-peserta-event', 'vcf'), 'text/x-vcard; charset=utf-8'),
    })
  }

  /* ----------------------------------------------------- daftar event */
  const regs = await prisma.eventRegistration.findMany({
    select: { eventId: true, paymentStatus: true, _count: { select: { attendances: true } } },
  })
  const perEvent = new Map<number, { total: number; hadir: number; valid: number }>()
  for (const r of regs) {
    const cur = perEvent.get(r.eventId) ?? { total: 0, hadir: 0, valid: 0 }
    cur.total += 1
    cur.hadir += r._count.attendances
    if (r.paymentStatus === 'valid') cur.valid += 1
    perEvent.set(r.eventId, cur)
  }

  const header = [
    'Judul Event', 'Slug', 'Tanggal Mulai', 'Tanggal Selesai', 'Status', 'Pendaftaran',
    'Biaya', 'Kuota Ikhwan', 'Kuota Akhwat', 'Jumlah Peserta', 'Bayar Valid', 'Sudah Hadir',
    'Link Internal', 'Dibuat',
  ]
  const rows = events.map((e) => {
    const c = perEvent.get(e.id) ?? { total: 0, hadir: 0, valid: 0 }
    return [
      e.title,
      e.slug,
      tgl(e.startDate),
      tgl(e.endDate),
      EVENT_STATUS_LABEL[e.status] ?? e.status,
      isEventRegistrationOpen(e) ? 'Dibuka' : 'Tutup',
      e.isPaid ? `Rp ${e.price.toLocaleString('id-ID')}` : 'Gratis',
      e.quotaIkhwan ?? '',
      e.quotaAkhwat ?? '',
      c.total,
      c.valid,
      c.hadir,
      e._count.internalLinks,
      tgl(e.createdAt),
    ]
  })

  if (format === 'csv') {
    return new Response(csvText(header, rows), {
      status: 200,
      headers: downloadHeaders(exportFileName('daftar-event', 'csv'), 'text/csv; charset=utf-8'),
    })
  }

  return new Response(excelXml('Daftar Event', header, rows), {
    status: 200,
    headers: downloadHeaders(exportFileName('daftar-event', 'xls'), 'application/vnd.ms-excel; charset=utf-8'),
  })
}
