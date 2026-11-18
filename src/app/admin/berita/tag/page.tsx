import prisma from '@/lib/prisma'
import { TagManager } from './TagManager'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tag Berita — Admin' }

export default async function AdminTagBeritaPage() {
  const tag = await prisma.postTag.findMany({
    orderBy: { nama: 'asc' },
    include: { _count: { select: { posts: true } } },
  })

  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Tag Berita</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tag adalah label bebas di artikel — berbeda dari kategori yang bisa disembunyikan. Setiap tag punya
          arsip publik sendiri di <span className="font-mono">/berita/tag/[slug]</span>.
        </p>
      </div>

      <TagManager
        tag={tag.map((t) => ({
          id: t.id,
          slug: t.slug,
          nama: t.nama,
          deskripsi: t.deskripsi,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          jumlahPost: t._count.posts,
        }))}
      />
    </div>
  )
}
