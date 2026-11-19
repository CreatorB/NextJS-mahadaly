import prisma from '@/lib/prisma'
import { WP_BASE_URL } from '@/lib/wordpress'
import { WordpressImporter } from './WordpressImporter'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Impor dari WordPress — Admin' }

export default async function ImporWordPressPage() {
  const kategori = await prisma.postKategori.findMany({
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
    select: { id: true, nama: true },
  })

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Impor dari WordPress</h1>
        <p className="mt-1 text-sm text-gray-500">
          Salin artikel dari WordPress syathiby.id ke panel Berita. Artikel hasil impor tetap bisa disunting seperti
          artikel biasa — sampul diunduh ke server (bukan hotlink), dan tag WordPress opsional karena sebagian besar
          tag WP berisi kata kunci SEO, bukan label yang menggambarkan pembaca.
        </p>
      </div>

      <WordpressImporter kategori={kategori} sumber={WP_BASE_URL} />
    </div>
  )
}
