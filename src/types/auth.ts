export interface SessionUser {
  userId: number
  roleId: number
  email: string
  nama: string
}

export type UserRole = 'superadmin' | 'admin' | 'santri'

export function getRoleName(roleId: number): UserRole {
  if (roleId === 1) return 'superadmin'
  if (roleId === 2) return 'admin'
  return 'santri'
}
