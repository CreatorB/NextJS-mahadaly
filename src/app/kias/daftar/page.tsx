import type { Metadata } from 'next'
import { KiasDaftarView } from './KiasDaftarView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Pendaftaran KIAS — Asy-Syathiby' }

export default async function KiasDaftarPage() {
  return <KiasDaftarView />
}
