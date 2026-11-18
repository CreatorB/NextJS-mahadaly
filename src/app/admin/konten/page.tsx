import { getKontenRows, getKontenItemAll } from '@/lib/konten'
import { keDtoKonten, keDtoItem } from '@/lib/konten-admin'
import { KontenAdmin } from './KontenAdmin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Konten Website — Admin' }

/**
 * Panel admin konten website publik.
 *
 * Tab "Teks & Label"  : semua teks statis halaman publik (hero, judul section,
 *                       footer, dst) — group per halaman.
 * Tab "Daftar"        : daftar berulang (pengajar, lulusan, kontak, materi,
 *                       fitur program) — tambah/ubah/hapus.
 */
export default async function AdminKontenPage() {
  const [rows, items] = await Promise.all([getKontenRows(), getKontenItemAll()])

  return (
    <KontenAdmin
      rows={rows.map(keDtoKonten)}
      items={items.map(keDtoItem)}
    />
  )
}
