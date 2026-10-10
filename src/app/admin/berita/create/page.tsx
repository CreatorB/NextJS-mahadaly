import prisma from '@/lib/prisma'
import { PostForm } from '../PostForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tulis Berita — Admin' }

export default async function CreateBeritaPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams
  const kategoriList = await prisma.postKategori.findMany({ orderBy: { id: 'asc' }, select: { id: true, nama: true, slug: true } })
  const preset = kategoriList.find((k) => k.slug === kategori)?.id

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-primary">Tulis Berita</h1>
      <PostForm mode="create" kategori={kategoriList} initial={preset ? { kategoriId: preset } : undefined} />
    </div>
  )
}
