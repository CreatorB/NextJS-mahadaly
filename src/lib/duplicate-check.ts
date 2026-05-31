import prisma from '@/lib/prisma'

export async function isDuplicateApplicant(params: {
  nama: string
  noHp: string
  tahunPsb: string
  programId: number
}): Promise<boolean> {
  const existing = await prisma.santri.findFirst({
    where: {
      nama: params.nama,
      noHp: params.noHp,
      tahunPsb: params.tahunPsb,
      programId: params.programId,
    },
  })
  return existing !== null
}
