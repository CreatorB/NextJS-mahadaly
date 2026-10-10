import Link from 'next/link'
import { CalendarDays, Clock, Wallet, Users, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sanitizeKonten } from '@/lib/berita'
import { formatRupiah } from '@/lib/kias'
import { eventImages, eventImageUrl, eventQuota, PAYMENT_STATUS_LABEL } from '@/lib/events'
import { EventRegisterForm } from './EventRegisterForm'

type EventRow = NonNullable<Awaited<ReturnType<typeof prisma.event.findUnique>>>

const fmt = (d: Date) => d.toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Halaman detail event + formulir; dipakai jalur publik dan link internal. */
export async function EventDetail({
  event, open, closedMessage, internal,
}: {
  event: EventRow
  open: boolean
  closedMessage?: string
  internal?: { token: string; name: string; sisaIkhwan: number; sisaAkhwat: number }
}) {
  const session = await getSession()
  const [quota, registration, user] = await Promise.all([
    eventQuota(event),
    session ? prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: event.id, userId: session.userId } } }) : null,
    session ? prisma.user.findUnique({ where: { id: session.userId }, select: { nama: true, email: true } }) : null,
  ])
  const images = eventImages(event.images)
  const regStart = event.registrationStart ?? new Date(event.startDate.getTime() - 30 * 86400000)
  const regEnd = event.registrationEnd ?? event.startDate

  return (
    <>
      <Navbar />
      <main className="bg-brand-surface py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/events" className="text-sm text-slate-500 hover:text-brand-primary">← Semua event</Link>
          <h1 className="mt-2 mb-6 text-3xl md:text-4xl font-bold text-brand-primary">
            {event.title}
            {internal && <span className="ml-3 align-middle rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">Jalur internal: {internal.name}</span>}
          </h1>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {images.length > 0 && (
                <div className={`grid gap-3 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
                  {images.map((img) => (
                    <a key={img} href={eventImageUrl(img)} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={eventImageUrl(img)} alt={event.title} className="w-full rounded-2xl object-cover shadow" />
                    </a>
                  ))}
                </div>
              )}
              <article className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="prose-berita" dangerouslySetInnerHTML={{ __html: sanitizeKonten(event.content) }} />
              </article>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl bg-white p-5 text-sm shadow-sm space-y-2">
                <p className="flex gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-brand-secondary" /> {fmt(event.startDate)} — {fmt(event.endDate)}</p>
                <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-brand-secondary" /> Pendaftaran: {fmt(regStart)} — {fmt(regEnd)}</p>
                <p className="flex gap-2"><Wallet className="h-4 w-4 shrink-0 text-brand-secondary" /> {event.isPaid ? formatRupiah(event.price) : 'Gratis'}</p>
                {internal ? (
                  <p className="flex gap-2"><Users className="h-4 w-4 shrink-0 text-brand-secondary" /> Sisa kuota link: ikhwan {internal.sisaIkhwan}, akhwat {internal.sisaAkhwat}</p>
                ) : (
                  (quota.sisaIkhwan !== null || quota.sisaAkhwat !== null) && (
                    <p className="flex gap-2"><Users className="h-4 w-4 shrink-0 text-brand-secondary" /> Sisa kuota: ikhwan {quota.sisaIkhwan ?? '∞'}, akhwat {quota.sisaAkhwat ?? '∞'}</p>
                  )
                )}
              </div>

              {registration ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Anda sudah terdaftar</p>
                  <p className="text-sm text-slate-600">Status: <strong>{PAYMENT_STATUS_LABEL[registration.paymentStatus]}</strong></p>
                  <Link href="/dashboard/events" className="mt-3 inline-block text-sm font-semibold text-brand-primary">Lihat di dashboard →</Link>
                </div>
              ) : open ? (
                <EventRegisterForm
                  slug={event.slug}
                  token={internal?.token}
                  isPaid={event.isPaid}
                  price={event.isPaid ? formatRupiah(event.price) : null}
                  loggedIn={user ? { nama: user.nama, email: user.email } : null}
                />
              ) : (
                <div className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm">{closedMessage ?? 'Pendaftaran event ini sudah ditutup atau belum dibuka.'}</div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
