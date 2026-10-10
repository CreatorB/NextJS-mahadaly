import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { fail } from '@/types/api'
import { requireAdminApi } from '@/lib/kias-admin'
import { PAYMENT_STATUS_LABEL } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const tglJam = (d: Date | null) => (d ? d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'short', timeStyle: 'short' }) : '')
const tgl = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

/** ?format=csv|xls — daftar peserta + jumlah & waktu kehadiran. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi(req))) return Response.json(fail('Akses ditolak'), { status: 401 })
  const id = Number((await params).id)
  const event = await prisma.event.findUnique({ where: { id }, select: { slug: true } })
  if (!event) return Response.json(fail('Event tidak ditemukan'), { status: 404 })
  const regs = await prisma.eventRegistration.findMany({
    where: { eventId: id },
    orderBy: { registeredAt: 'asc' },
    include: { attendances: { orderBy: { attendedAt: 'asc' } }, internalLink: { select: { name: true } } },
  })

  const header = ['No', 'Nama', 'Jenis Kelamin', 'No HP', 'Email', 'Alamat', 'Tempat Lahir', 'Tanggal Lahir', 'Pekerjaan', 'Status', 'Jalur', 'Tgl Daftar', 'Jumlah Hadir', 'Waktu Hadir']
  const rows = regs.map((r, i) => [
    i + 1, r.name, r.gender, r.phone, r.email, r.address ?? '', r.birthPlace ?? '', tgl(r.birthDate), r.occupation ?? '',
    PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus, r.internalLink ? `Internal: ${r.internalLink.name}` : 'Publik',
    tglJam(r.registeredAt), r.attendances.length, r.attendances.map((a) => tglJam(a.attendedAt)).join('; '),
  ])
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  if (req.nextUrl.searchParams.get('format') === 'xls') {
    const x = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const cell = (v: string | number, st = '') => `<Cell${st}><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${x(v)}</Data></Cell>`
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#00367C" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Peserta"><Table>
<Row>${header.map((h) => cell(h, ' ss:StyleID="h"')).join('')}</Row>
${rows.map((r) => `<Row>${r.map((v) => cell(v)).join('')}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`
    return new Response(body, {
      headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="peserta-${event.slug}-${stamp}.xls"`, 'Cache-Control': 'no-store' },
    })
  }

  const esc = (v: string | number) => (/[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  const csv = '﻿' + [header.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n')
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="peserta-${event.slug}-${stamp}.csv"`, 'Cache-Control': 'no-store' },
  })
}
