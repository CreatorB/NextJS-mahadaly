import { listBerkas } from '@/lib/berkas'
import { BerkasManager } from './BerkasManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Manajemen Berkas — Admin' }

/**
 * Panel manajemen disk.
 *
 * Menampilkan berkas yang boleh dikelola (materi, gambar berita, poster event),
 * dengan unduh ZIP massal dan hapus massal. Berkas yang masih dirujuk konten
 * diblokir hapus kecuali dipaksa.
 */
export default async function AdminBerkasPage() {
  const ringkasan = await listBerkas()

  return (
    <BerkasManager
      awal={{
        files: ringkasan.files,
        totalUkuran: ringkasan.totalUkuran,
        totalSemua: ringkasan.totalSemua,
        jumlahSemua: ringkasan.jumlahSemua,
        folder: ringkasan.folder,
      }}
    />
  )
}
