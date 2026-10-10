import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { eventGroupLink, PAYMENT_STATUS_LABEL } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran Event Berhasil', robots: { index: false } }

export default async function EventSuksesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event) notFound()
  const session = await getSession()
  const reg = session ? await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: session.userId } } }) : null
  const group = reg?.paymentStatus === 'valid' ? eventGroupLink(event, reg.gender) : null

  return (
    <>
      <Navbar />
      <main className="bg-brand-surface py-16 px-4">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="mb-2 text-2xl font-bold text-brand-primary">Pendaftaran Berhasil</h1>
          <p className="mb-6 text-slate-600">{event.title}</p>
          {reg && <p className="mb-6 text-sm text-slate-600">Status: <strong>{PAYMENT_STATUS_LABEL[reg.paymentStatus]}</strong></p>}
          {group ? (
            <a href={group} target="_blank" rel="noopener noreferrer" className="mb-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white">
              <MessageCircle className="h-5 w-5" /> Gabung grup peserta
            </a>
          ) : (
            reg && <p className="mb-4 text-sm text-slate-500">Link grup muncul di dashboard setelah pendaftaran diverifikasi panitia.</p>
          )}
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/events" className="rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white">Event saya</Link>
            <Link href={`/events/${slug}`} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700">Kembali</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
