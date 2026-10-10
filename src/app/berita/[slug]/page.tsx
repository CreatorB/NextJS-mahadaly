import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { sanitizeKonten, toPlainText, uploadUrl } from '@/lib/berita'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function getPost(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, include: { kategori: true, author: { select: { nama: true } } } })
  if (!post || post.status !== 'published' || !post.publishedAt || post.publishedAt > new Date()) return null
  return post
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return { title: 'Berita tidak ditemukan' }
  const description = post.ringkasan || toPlainText(post.konten).slice(0, 160)
  const image = uploadUrl(post.coverImage)
  return {
    title: `${post.judul} — Asy-Syathiby`,
    description,
    openGraph: { title: post.judul, description, images: image ? [image] : undefined },
  }
}

export default async function BeritaDetailPage({ params }: Props) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  const cover = uploadUrl(post.coverImage)

  return (
    <>
      <Navbar />
      <main className="bg-white py-12 px-4">
        <article className="max-w-3xl mx-auto">
          <Link
            href={`/berita?kategori=${post.kategori.slug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Berita {post.kategori.nama}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-3">{post.judul}</h1>
          <p className="text-sm text-slate-500 mb-8">
            {post.publishedAt!.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {post.author && ` · ${post.author.nama}`}
          </p>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={post.judul} className="mb-8 w-full rounded-2xl object-cover" />
          )}
          <div className="prose-berita" dangerouslySetInnerHTML={{ __html: sanitizeKonten(post.konten) }} />
        </article>
      </main>
      <Footer />
    </>
  )
}
