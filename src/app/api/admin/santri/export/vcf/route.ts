import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/auth'
import { fail } from '@/types/api'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function buildVCard(s: {
  nama: string
  kodeRegistrasi: string
  tahunPsb: string
  jk?: string | null
  tmpLahir: string | null
  tglLahir: Date | null
  email: string
  noHp: string
  kodeNegara: string
  namaAyah: string | null
  noHpAyah: string | null
  namaIbu: string | null
  noHpIbu: string | null
  namaWali: string | null
  noHpWali: string | null
  program?: { namaProgram: string } | null
}): string {
  const lines: string[] = []
  const tahun = s.tahunPsb || ''
  const genderLetter = s.jk === 'Laki-Laki' ? 'L' : s.jk === 'Perempuan' ? 'P' : 'X'
  const tahunShort = tahun ? tahun.slice(-2) : String(new Date().getFullYear()).slice(-2)
  const programCode = 'Aly'
  const displayName = `${programCode}${tahunShort}${genderLetter} ${s.nama}`
  const kode = s.kodeRegistrasi ? `[${s.kodeRegistrasi}]` : ''
  const programName = s.program?.namaProgram ? s.program.namaProgram.split(' ')[0] : 'Mahasantri'
  lines.push('BEGIN:VCARD')
  lines.push('VERSION:3.0')
  lines.push(`FN:${esc(displayName)}`)
  lines.push(`N:${esc(displayName)};;;;`)
  lines.push(`ORG:KIAS ${esc(tahun)}`)
  lines.push(`NICKNAME:${esc(programName)} ${esc(kode)}`.trim())
  if (s.tmpLahir || s.tglLahir) {
    const dob = s.tglLahir ? new Date(s.tglLahir).toISOString().slice(0, 10).replace(/-/g, '') : ''
    if (dob) lines.push(`BDAY:${dob}`)
  }
  if (s.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(s.email)}`)
  const hp = s.kodeNegara && s.noHp ? `+${s.kodeNegara}${s.noHp}` : ''
  if (hp) lines.push(`TEL;TYPE=CELL:${esc(hp)}`)
  if (s.noHpAyah) lines.push(`TEL;TYPE=CELL:${esc(s.noHpAyah)}`)
  if (s.noHpIbu) lines.push(`TEL;TYPE=CELL:${esc(s.noHpIbu)}`)
  if (s.noHpWali) lines.push(`TEL;TYPE=CELL:${esc(s.noHpWali)}`)
  if (s.namaAyah) lines.push(`X-ayah:${esc(s.namaAyah)}`)
  if (s.namaIbu) lines.push(`X-ibu:${esc(s.namaIbu)}`)
  if (s.namaWali) lines.push(`X-wali:${esc(s.namaWali)}`)
  if (s.tmpLahir) lines.push(`ADR;TYPE=HOME:;;${esc(s.tmpLahir)};;;;`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifyTokenFromRequest(req)
    if (!session || (session.roleId !== 1 && session.roleId !== 2)) {
      return Response.json(fail('Akses ditolak'), { status: 401 })
    }
    const rows = await prisma.santri.findMany({
      orderBy: { nama: 'asc' },
      include: { program: true },
    })
    const vcards = rows.map(r => buildVCard({
      nama: r.nama,
      kodeRegistrasi: r.kodeRegistrasi,
      tahunPsb: r.tahunPsb,
      jk: r.jk,
      tmpLahir: r.tmpLahir,
      tglLahir: r.tglLahir,
      email: r.email,
      noHp: r.noHp,
      kodeNegara: r.kodeNegara,
      namaAyah: r.namaAyah,
      noHpAyah: r.noHpAyah,
      namaIbu: r.namaIbu,
      noHpIbu: r.noHpIbu,
      namaWali: r.namaWali,
      noHpWali: r.noHpWali,
      program: r.program,
    }))
    const body = vcards.join('\r\n') + '\r\n'
    const d = new Date()
    const fname = `Mahasantri_KIAS_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.vcf`
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/x-vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fname}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error(e)
    return Response.json(fail('Terjadi kesalahan'), { status: 500 })
  }
}
