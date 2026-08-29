import prisma from '@/lib/prisma'

export type ValidatedRegistrationLink = {
  id: number
  slug: string
  label: string
  quota: number | null
  usedCount: number
  expiresAt: Date | null
  isActive: boolean
}

export type LinkValidationResult =
  | { ok: true; link: ValidatedRegistrationLink; remainingQuota: number | null }
  | { ok: false; reason: 'not_found' | 'inactive' | 'expired' | 'full' }

export async function validateRegistrationLink(slug: string): Promise<LinkValidationResult> {
  const link = await prisma.registrationLink.findUnique({ where: { slug } })
  if (!link) return { ok: false, reason: 'not_found' }
  if (!link.isActive) return { ok: false, reason: 'inactive' }

  const now = new Date()
  if (link.expiresAt && link.expiresAt <= now) return { ok: false, reason: 'expired' }

  if (link.quota !== null && link.usedCount >= link.quota) {
    return { ok: false, reason: 'full' }
  }

  return {
    ok: true,
    link: {
      id: link.id,
      slug: link.slug,
      label: link.label,
      quota: link.quota,
      usedCount: link.usedCount,
      expiresAt: link.expiresAt,
      isActive: link.isActive,
    },
    remainingQuota: link.quota === null ? null : Math.max(0, link.quota - link.usedCount),
  }
}

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: 'inactive' | 'expired' | 'full' | 'race_lost' }

/**
 * Atomically increment usedCount for a registration link, respecting quota.
 * Must be called inside the same Prisma transaction that creates the Santri record.
 *
 * Uses conditional update: `usedCount < quota` (or quota = null). If two requests
 * race for the last slot, one wins, the other gets `race_lost`.
 */
export async function claimQuotaSlot(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  linkId: number,
): Promise<ClaimResult> {
  const link = await tx.registrationLink.findUnique({ where: { id: linkId } })
  if (!link) return { ok: false, reason: 'inactive' }
  if (!link.isActive) return { ok: false, reason: 'inactive' }

  const now = new Date()
  if (link.expiresAt && link.expiresAt <= now) return { ok: false, reason: 'expired' }

  if (link.quota !== null && link.usedCount >= link.quota) {
    return { ok: false, reason: 'full' }
  }

  if (link.quota === null) {
    await tx.registrationLink.update({
      where: { id: linkId },
      data: { usedCount: { increment: 1 } },
    })
    return { ok: true }
  }

  // Conditional update: only succeeds if usedCount still < quota at write time.
  // Prisma's `updateMany` returns count; if 0, another tx beat us to the last slot.
  const result = await tx.registrationLink.updateMany({
    where: { id: linkId, usedCount: { lt: link.quota } },
    data: { usedCount: { increment: 1 } },
  })

  if (result.count === 0) return { ok: false, reason: 'race_lost' }
  return { ok: true }
}
