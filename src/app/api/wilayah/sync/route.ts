import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface IbnuxProvinsi {
  id: string
  nama: string
}

interface IbnuxKabupaten {
  id: string
  nama: string
  provinsi_id: string
}

interface IbnuxKecamatan {
  id: string
  nama: string
  kabupaten_id: string
}

interface IbnuxDesa {
  id: string
  nama: string
  kecamatan_id: string
  kode_pos: string
}

export async function GET() {
  try {
    const baseUrl = 'https://ibnux.github.io/data-indonesia'

    console.log('Fetching provinsi...')
    const provRes = await fetch(`${baseUrl}/provinsi.json`)
    if (!provRes.ok) throw new Error('Failed to fetch provinsi')
    const provList: IbnuxProvinsi[] = await provRes.json()

    console.log(`Found ${provList.length} provinces. Syncing...`)

    let totalKab = 0
    let totalKec = 0
    let totalDesa = 0

    for (const prov of provList) {
      const provId = parseInt(prov.id)
      await prisma.provinsi.upsert({
        where: { id: provId },
        update: { nama: prov.nama },
        create: { id: provId, nama: prov.nama },
      })

      console.log(`Syncing kabupaten for provinsi ${prov.id}...`)
      const kabRes = await fetch(`${baseUrl}/kabupaten/${prov.id}.json`)
      if (kabRes.ok) {
        const kabList: IbnuxKabupaten[] = await kabRes.json()
        for (const kab of kabList) {
          const kabId = parseInt(kab.id)
          await prisma.kabupatenKota.upsert({
            where: { id: kabId },
            update: { nama: kab.nama, provinsiId: provId },
            create: { id: kabId, nama: kab.nama, provinsiId: provId },
          })
          totalKab++

          console.log(`Syncing kecamatan for kabupaten ${kab.id}...`)
          const kecRes = await fetch(`${baseUrl}/kecamatan/${kab.id}.json`)
          if (kecRes.ok) {
            const kecList: IbnuxKecamatan[] = await kecRes.json()
            for (const kec of kecList) {
              const kecId = parseInt(kec.id)
              await prisma.kecamatan.upsert({
                where: { id: kecId },
                update: { nama: kec.nama, kabupatenId: kabId },
                create: { id: kecId, nama: kec.nama, kabupatenId: kabId },
              })
              totalKec++

              console.log(`Syncing desa for kecamatan ${kec.id}...`)
              const desaRes = await fetch(`${baseUrl}/desa/${kec.id}.json`)
              if (desaRes.ok) {
                const desaList: IbnuxDesa[] = await desaRes.json()
                for (const desa of desaList) {
                  const desaId = parseInt(desa.id)
                  await prisma.desa.upsert({
                    where: { id: desaId },
                    update: { nama: desa.nama, kodePos: desa.kode_pos, kecamatanId: kecId },
                    create: { id: desaId, nama: desa.nama, kodePos: desa.kode_pos, kecamatanId: kecId },
                  })
                  totalDesa++
                }
              }
            }
          }
        }
      }
    }

    const [provCount, kabCount, kecCount, desaCount] = await Promise.all([
      prisma.provinsi.count(),
      prisma.kabupatenKota.count(),
      prisma.kecamatan.count(),
      prisma.desa.count(),
    ])

    return NextResponse.json({
      success: true,
      message: 'Sync complete',
      counts: {
        provinsi: provCount,
        kabupaten: kabCount,
        kecamatan: kecCount,
        desa: desaCount,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, message: 'Sync failed' }, { status: 500 })
  }
}