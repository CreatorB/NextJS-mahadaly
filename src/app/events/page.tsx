import Link from 'next/link'
import type { Metadata } from 'next'
import { CalendarDays, Users } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { eventImages, eventImageUrl, isEventRegistrationOpen } from '@/lib/events'
import { formatRupiah } from '@/lib/kias'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Event — Asy-Syathiby', description: 'Daurah, kajian, dan kegiatan Ma\'had Imam Asy-Syathiby.' }

const tgl = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default async function EventsPage() {
  const events = await prisma.event.findMany({ where: { status: 'published' }, orderBy: { startDate: 'desc' }, take: 24 })
  const now = new Date()

  return (
    <>
      <Navbar />
      <main className="min-h-[60vh] bg-brand-surface py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="mb-2 text-3xl md:text-4xl font-bold text-brand-primary">Event</h1>
          <p className="mb-8 text-slate-600">Daurah, kajian, dan kegiatan terbuka untuk umum.</p>
          {events.length === 0 ? (
            <p className="py-16 text-center text-slate-500">Belum ada event.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => {
                const img = eventImages(e.images)[0]
                const open = isEventRegistrationOpen(e)
                const selesai = e.endDate < now
                return (
                  <Link key={e.id} href={`/events/${e.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-[4/5] bg-gradient-to-br from-brand-primary to-brand-secondary">
                      {img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={eventImageUrl(img)} alt={e.title} loading="lazy" className="h-full w-full object-cover" />
                      )}
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow ${
                        open ? 'bg-emerald-500 text-white' : selesai ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'
                      }`}>
                        {open ? 'Pendaftaran dibuka' : selesai ? 'Selesai' : 'Pendaftaran ditutup'}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="mb-2 line-clamp-2 font-bold text-slate-900 group-hover:text-brand-primary">{e.title}</h2>
                      <p className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4" /> {tgl(e.startDate)}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Users className="h-4 w-4" /> {e.isPaid ? formatRupiah(e.price) : 'Gratis'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
