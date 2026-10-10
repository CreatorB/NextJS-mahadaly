import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { toPlainText } from '@/lib/berita'
import { eventImages, eventImageUrl, isEventRegistrationOpen } from '@/lib/events'
import { EventDetail } from '@/components/events/EventDetail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const getEvent = (slug: string) => prisma.event.findFirst({ where: { slug, status: { in: ['published', 'closed'] } } })

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await getEvent((await params).slug)
  if (!e) return { title: 'Event tidak ditemukan' }
  const img = eventImages(e.images)[0]
  const description = toPlainText(e.content).slice(0, 160)
  return { title: `${e.title} — Asy-Syathiby`, description, openGraph: { title: e.title, description, images: img ? [eventImageUrl(img)] : undefined } }
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent((await params).slug)
  if (!event) notFound()
  return <EventDetail event={event} open={isEventRegistrationOpen(event)} />
}
