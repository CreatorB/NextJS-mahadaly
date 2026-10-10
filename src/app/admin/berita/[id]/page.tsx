import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { uploadUrl } from '@/lib/berita'
import { PostForm } from '../PostForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit Berita — Admin' }

export default async function EditBeritaPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const [post, kategoriList] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.postKategori.findMany({ orderBy: { id: 'asc' }, select: { id: true, nama: true } }),
  ])
  if (!post) notFound()

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-brand-primary">Edit Berita</h1>
      <PostForm
        mode="edit"
        kategori={kategoriList}
        initial={{
          id: post.id,
          judul: post.judul,
          slug: post.slug,
          ringkasan: post.ringkasan,
          konten: post.konten,
          coverImage: post.coverImage,
          coverUrl: uploadUrl(post.coverImage),
          status: post.status === 'published' ? 'published' : 'draft',
          publishedAt: post.publishedAt?.toISOString() ?? null,
          kategoriId: post.kategoriId,
        }}
      />
    </div>
  )
}
