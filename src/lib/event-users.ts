import prisma from '@/lib/prisma'
import { RESET_LINK_TYPE, RESET_REQUEST_TYPE } from '@/lib/password-reset'

export interface ManagedUser {
  id: number
  nama: string
  email: string
  roleId: number
  roleName: string
  isActive: boolean
  createdAt: Date
  passwordChangedAt: Date | null
  akun: 'event' | 'santri' | 'kias' | 'akun'
  eventCount: number
  eventList: string[]
  adaRequest: boolean
  requestAt: Date | null
  requestToken: string | null
  resetToken: string | null
  resetExpiresAt: Date | null
}

export interface ManagedUserFilter {
  q?: string
  role?: string
  type?: string
}

/** Versi serializable (tanggal jadi string) untuk dikirim ke client component. */
export interface ManagedUserDTO {
  id: number
  nama: string
  email: string
  roleId: number
  roleName: string
  isActive: boolean
  createdAt: string
  passwordChangedAt: string | null
  akun: 'event' | 'santri' | 'kias' | 'akun'
  eventCount: number
  eventList: string[]
  adaRequest: boolean
  requestAt: string | null
  requestToken: string | null
  resetToken: string | null
  resetExpiresAt: string | null
}

export function toManagedUserDTO(u: ManagedUser): ManagedUserDTO {
  return {
    ...u,
    createdAt: u.createdAt.toISOString(),
    passwordChangedAt: u.passwordChangedAt ? u.passwordChangedAt.toISOString() : null,
    requestAt: u.requestAt ? u.requestAt.toISOString() : null,
    resetExpiresAt: u.resetExpiresAt ? u.resetExpiresAt.toISOString() : null,
  }
}

/**
 * Daftar akun yang dikelola admin (untuk reset password / nonaktifkan).
 * Semua jenis akun ikut: peserta event, Santri PSB, Santri KIAS, dan akun biasa.
 */
export async function listManagedUsers(filter: ManagedUserFilter = {}): Promise<ManagedUser[]> {
  const where: Record<string, unknown> = {}
  if (filter.q) {
    where.OR = [{ nama: { contains: filter.q } }, { email: { contains: filter.q } }]
  }
  if (filter.role && filter.role !== 'all') where.roleId = Number(filter.role)
  if (filter.type && filter.type !== 'all') {
    if (filter.type === 'event') where.eventRegistrations = { some: {} }
    else if (filter.type === 'santri') where.siswaId = { not: null }
    else if (filter.type === 'kias') where.kiasSantriId = { not: null }
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      role: { select: { namaRole: true } },
      eventRegistrations: { include: { event: { select: { title: true, slug: true } } } },
      resetTokens: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const now = Date.now()
  return users.map((u) => {
    const request = u.resetTokens.find((t) => t.type === RESET_REQUEST_TYPE && !t.usedAt && t.expiresAt.getTime() > now) ?? null
    const link = u.resetTokens.find((t) => t.type === RESET_LINK_TYPE && !t.usedAt && t.expiresAt.getTime() > now) ?? null
    const akun: ManagedUser['akun'] =
      u.roleId === 4 ? 'event' : u.roleId === 3 ? (u.kiasSantriId && !u.siswaId ? 'kias' : 'santri') : 'akun'
    return {
      id: u.id,
      nama: u.nama,
      email: u.email,
      roleId: u.roleId,
      roleName: u.role.namaRole,
      isActive: u.isActive,
      createdAt: u.createdAt,
      passwordChangedAt: u.passwordChangedAt,
      akun,
      eventCount: u.eventRegistrations.length,
      eventList: u.eventRegistrations.map((r) => r.event.title),
      adaRequest: !!request,
      requestAt: request?.createdAt ?? null,
      requestToken: request?.token ?? null,
      resetToken: link?.token ?? null,
      resetExpiresAt: link?.expiresAt ?? null,
    }
  })
}
