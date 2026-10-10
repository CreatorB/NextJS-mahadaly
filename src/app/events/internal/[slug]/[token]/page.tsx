import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { isInternalLinkAvailable } from '@/lib/events'
import { EventDetail } from '@/components/events/EventDetail'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran Event (Internal)', robots: { index: false } }

export default async function InternalEventPage({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params
  const event = await prisma.event.findFirst({ where: { slug, status: { in: ['published', 'internal'] } } })
  if (!event) notFound()
  const link = await prisma.eventInternalLink.findFirst({ where: { token, eventId: event.id } })
  if (!link) notFound()

  const available = isInternalLinkAvailable(link)
  // Sama dengan KIAS lama: link habis → event publik dialihkan ke halaman biasa, event internal 404.
  if (!available && event.status === 'internal') notFound()
  if (!available) redirect(`/events/${slug}`)

  return (
    <EventDetail
      event={event}
      open={available}
      internal={{
        token,
        name: link.name,
        sisaIkhwan: Math.max(0, link.quotaIkhwan - link.usageIkhwan),
        sisaAkhwat: Math.max(0, link.quotaAkhwat - link.usageAkhwat),
      }}
    />
  )
}
