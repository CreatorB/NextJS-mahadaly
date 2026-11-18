import prisma from '@/lib/prisma'
import { KategoriManager } from './KategoriManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Kategori Berita — Admin' }

export default async function AdminKategoriBeritaPage() {
  const kategori = await prisma.postKategori.findMany({
    orderBy: [{ urutan: 'asc' }, { id: 'asc' }],
    include: { _count: { select: { posts: true } } },
  })

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Kategori Berita</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kategori menentukan arsip publik, filter di panel admin, dan metadata SEO tiap halaman kategori.
          Kategori yang disembunyikan tidak muncul di situs.
        </p>
      </div>

      <KategoriManager
        kategori={kategori.map((k) => ({
          id: k.id,
          slug: k.slug,
          nama: k.nama,
          deskripsi: k.deskripsi,
          seoTitle: k.seoTitle,
          seoDescription: k.seoDescription,
          urutan: k.urutan,
          tampil: k.tampil,
          jumlahPost: k._count.posts,
        }))}
      />
    </div>
  )
}
