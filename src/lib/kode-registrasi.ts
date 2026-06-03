import prisma from '@/lib/prisma'

export async function generateKodeRegistrasi(tahunPsb: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await prisma.santri.count({ where: { tahunPsb } })
  const rand = String(Math.floor(Math.random() * 900) + 100) // 100–999, prevents concurrent collisions
  return `${yy}${mm}${dd}${String(count + 1).padStart(3, '0')}${rand}`
}
