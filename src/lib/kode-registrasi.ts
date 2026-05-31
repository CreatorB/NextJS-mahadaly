import prisma from '@/lib/prisma'

export async function generateKodeRegistrasi(tahunPsb: string): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const count = await prisma.santri.count({ where: { tahunPsb } })
  return `${yy}${mm}${dd}${count + 1}`
}
