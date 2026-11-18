import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import prisma from '@/lib/prisma'
import { uploadUrl } from '@/lib/berita'
import { APP_BASE_URL } from '@/lib/berita-seo'
import { PostForm } from '../PostForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit Berita — Admin' }

export default async function EditBeritaPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const [post, kategoriList, tagList, penulis] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: { tags: { include: { tag: { select: { nama: true } } } } },
    }),
    prisma.postKategori.findMany({ orderBy: [{ urutan: 'asc' }, { id: 'asc' }] }),
    prisma.postTag.findMany({ orderBy: { nama: 'asc' } }),
    prisma.user.findMany({
      where: { roleId: { lte: 2 }, isActive: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true, email: true },
    }),
  ])
  if (!post) notFound()

  return (
    <div className="p-6 sm:p-8">
      <h1 className="mb-5 text-2xl font-bold text-brand-primary">Edit Berita</h1>
      <PostForm
        mode="edit"
        kategori={kategoriList.map((k) => ({ id: k.id, nama: k.nama, slug: k.slug, tampil: k.tampil }))}
        tags={tagList.map((t) => ({ id: t.id, slug: t.slug, nama: t.nama }))}
        authors={penulis}
        initial={{
          id: post.id,
          judul: post.judul,
          slug: post.slug,
          ringkasan: post.ringkasan,
          konten: post.konten,
          coverImage: post.coverImage,
          coverUrl: uploadUrl(post.coverImage),
          coverAlt: post.coverAlt,
          status: post.status === 'published' ? 'published' : 'draft',
          publishedAt: post.publishedAt?.toISOString() ?? null,
          kategoriId: post.kategoriId,
          tagSlugs: post.tags.map((t) => t.tag.nama),
          authorId: post.authorId,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          focusKeyword: post.focusKeyword,
          seoKeywords: post.seoKeywords,
          canonicalUrl: post.canonicalUrl,
          noindex: post.noindex,
          nofollow: post.nofollow,
          ogImage: post.ogImage,
          twitterImage: post.twitterImage,
          schemaJsonLd: post.schemaJsonLd,
          sticky: post.sticky,
          dibuat: format(post.createdAt, 'd MMM yyyy HH:mm', { locale: idLocale }),
          diubah: format(post.updatedAt, 'd MMM yyyy HH:mm', { locale: idLocale }),
        }}
        baseUrl={APP_BASE_URL}
      />
    </div>
  )
}
