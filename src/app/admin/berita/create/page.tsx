import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { APP_BASE_URL } from '@/lib/berita-seo'
import { PostForm } from '../PostForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tulis Berita — Admin' }

export default async function CreateBeritaPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams
  const session = await getSession()

  const [kategoriList, tagList, penulis] = await Promise.all([
    prisma.postKategori.findMany({ orderBy: [{ urutan: 'asc' }, { id: 'asc' }] }),
    prisma.postTag.findMany({ orderBy: { nama: 'asc' } }),
    prisma.user.findMany({
      where: { roleId: { lte: 2 }, isActive: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, email: true },
    }),
  ])

  const preset = kategoriList.find((k) => k.slug === kategori)?.id

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-5 text-2xl font-bold text-brand-primary">Tulis Berita</h1>
      <PostForm
        mode="create"
        kategori={kategoriList.map((k) => ({ id: k.id, nama: k.nama, slug: k.slug, tampil: k.tampil }))}
        tags={tagList.map((t) => ({ id: t.id, slug: t.slug, nama: t.nama }))}
        authors={penulis}
        initial={{
          kategoriId: preset ?? kategoriList[0]?.id,
          authorId: session?.userId ?? null,
        }}
        baseUrl={APP_BASE_URL}
      />
    </div>
  )
}
