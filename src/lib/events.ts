import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'
import { UPLOAD_BASE } from '@/lib/storage'

export const EVENT_STATUS = ['draft', 'published', 'internal', 'closed'] as const
export const EVENT_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', published: 'Terbit', internal: 'Internal (hanya lewat link)', closed: 'Ditutup',
}
export const PAYMENT_STATUS_LABEL: Record<string, string> = { pending: 'Menunggu', valid: 'Valid', invalid: 'Ditolak' }

type EventWindow = { status: string; startDate: Date; registrationStart: Date | null; registrationEnd: Date | null }

/** Sama dengan Event::isRegistrationOpen() KIAS: default buka 30 hari sebelum mulai s.d. waktu mulai. */
export function isEventRegistrationOpen(e: EventWindow, now = new Date()) {
  const start = e.registrationStart ?? new Date(e.startDate.getTime() - 30 * 86400000)
  const end = e.registrationEnd ?? e.startDate
  return now >= start && now <= end && (e.status === 'published' || e.status === 'internal')
}

/** Gambar poster event (path relatif UPLOAD_DIR, folder events/images = publik). */
export function eventImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}
export const eventImageUrl = (name: string) => `/uploads/events/images/${encodeURIComponent(name)}`

export async function eventQuota(e: { id: number; quotaIkhwan: number | null; quotaAkhwat: number | null }) {
  const counts = await prisma.eventRegistration.groupBy({
    by: ['gender'],
    where: { eventId: e.id, paymentStatus: { in: ['pending', 'valid'] } },
    _count: true,
  })
  const ikhwan = counts.find((c) => c.gender === 'Laki-Laki')?._count ?? 0
  const akhwat = counts.find((c) => c.gender === 'Perempuan')?._count ?? 0
  return {
    ikhwan,
    akhwat,
    sisaIkhwan: e.quotaIkhwan == null ? null : Math.max(0, e.quotaIkhwan - ikhwan),
    sisaAkhwat: e.quotaAkhwat == null ? null : Math.max(0, e.quotaAkhwat - akhwat),
  }
}

type LinkLike = { quotaIkhwan: number; quotaAkhwat: number; usageIkhwan: number; usageAkhwat: number; activeFrom: Date | null; activeUntil: Date | null }

/** Sama dengan EventInternalLink::isAvailable() KIAS. */
export function isInternalLinkAvailable(l: LinkLike, gender?: string | null, now = new Date()) {
  if (l.activeFrom && now < l.activeFrom) return false
  if (l.activeUntil && now > l.activeUntil) return false
  if (gender === 'Laki-Laki') return l.usageIkhwan < l.quotaIkhwan
  if (gender === 'Perempuan') return l.usageAkhwat < l.quotaAkhwat
  return l.usageIkhwan < l.quotaIkhwan || l.usageAkhwat < l.quotaAkhwat
}

/** Link grup yang boleh dilihat peserta (setelah pembayaran valid). */
export function eventGroupLink(e: { groupIkhwan: string | null; groupAkhwat: string | null; groupPublic: string | null }, gender: string) {
  return (gender === 'Laki-Laki' ? e.groupIkhwan : e.groupAkhwat) || e.groupPublic || null
}

const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Simpan file event. folder images = publik (poster); payments = privat (bukti bayar). */
export async function saveEventFile(file: File, folder: 'images' | 'payments', maxBytes: number) {
  const ext = IMAGE_EXT[file.type]
  if (!ext) throw new Error('File harus gambar JPG, PNG, atau WEBP')
  if (file.size > maxBytes) throw new Error(`Ukuran maksimal ${Math.round(maxBytes / 1024 / 1024)} MB`)
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const name = `${stamp}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const dir = path.join(UPLOAD_BASE, 'events', folder)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
  return name
}

export function eventPaymentPath(name: string) {
  const base = path.resolve(UPLOAD_BASE, 'events', 'payments')
  const p = path.resolve(base, path.basename(name))
  return p.startsWith(base + path.sep) ? p : null
}
