import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, CheckCircle2, MessageCircle } from 'lucide-react'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { eventGroupLink, PAYMENT_STATUS_LABEL } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Event Saya' }

const badge: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', valid: 'bg-green-100 text-green-800', invalid: 'bg-red-100 text-red-800' }

export default async function DashboardEventsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const regs = await prisma.eventRegistration.findMany({
    where: { userId: session.userId },
    orderBy: { registeredAt: 'desc' },
    include: { event: true, _count: { select: { attendances: true } } },
  })

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Event Saya</h1>
        <p className="text-sm text-gray-500">Riwayat pendaftaran event dan kehadiran Anda.</p>
      </div>
      {regs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Belum ada event yang diikuti. <Link href="/events" className="font-semibold text-brand-primary">Lihat event</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {regs.map((r) => {
            const group = r.paymentStatus === 'valid' ? eventGroupLink(r.event, r.gender) : null
            return (
              <li key={r.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/events/${r.event.slug}`} className="font-semibold text-gray-900 hover:text-brand-primary">{r.event.title}</Link>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarDays className="h-4 w-4" />
                      {r.event.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[r.paymentStatus] ?? ''}`}>{PAYMENT_STATUS_LABEL[r.paymentStatus]}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  {r.event.hasAttendance && (
                    <span className="inline-flex items-center gap-1.5 text-gray-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Hadir {r._count.attendances} kali</span>
                  )}
                  {r.paymentProof && <a href={`/api/events/bukti/${r.id}`} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Bukti pembayaran</a>}
                  {group && (
                    <a href={group} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                      <MessageCircle className="h-4 w-4" /> Grup peserta
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
