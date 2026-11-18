import { notFound, redirect } from 'next/navigation'
import { Eye } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sanitizeKonten, uploadUrl } from '@/lib/berita'
import { buildToc } from '@/lib/toc'
import { countWords, readingMinutes } from '@/lib/seo-score'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Pratinjau Berita',
  robots: { index: false, follow: false, nocache: true },
}

type Props = { params: Promise<{ id: string }> }

/**
 * Pratinjau artikel yang belum tayang. Hanya admin yang boleh melihat —
 * halaman ini tidak boleh terindeks, itu sebabnya robots di-nol-kan.
 */
export default async function PreviewBeritaPage({ params }: Props) {
  const session = await getSession()
  if (!session || session.roleId > 2) redirect('/login')

  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      kategori: { select: { slug: true, nama: true } },
      author: { select: { nama: true } },
      tags: { include: { tag: { select: { slug: true, nama: true } } } },
    },
  })
  if (!post) notFound()

  const cover = uploadUrl(post.coverImage)
  const { headings, html } = buildToc(sanitizeKonten(post.konten))
  const words = countWords(post.konten)

  return (
    <>
      <Navbar />
      <div className="sticky top-0 z-30 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-900">
        <span className="inline-flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Mode pratinjau — artikel ini belum tayang ke publik
          {post.status === 'draft' ? ' (status: Draft)' : ''}
        </span>
      </div>

      <main className="bg-white py-10 px-4">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{post.judul}</h1>
          <p className="mt-4 text-sm text-slate-500">
            {post.publishedAt?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) ?? 'Belum terbit'}
            {post.author ? ` · ${post.author.nama}` : ''} · {readingMinutes(words)} menit baca · {post.kategori.nama}
          </p>

          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={post.coverAlt || post.judul} className="mt-7 w-full rounded-2xl object-cover" />
          )}

          {post.ringkasan && (
            <p className="mt-7 border-l-4 border-brand-light bg-slate-50 px-4 py-3 text-base text-slate-700">{post.ringkasan}</p>
          )}

          <div className="prose-berita mt-7" dangerouslySetInnerHTML={{ __html: html }} />

          {headings.length > 0 && (
            <details className="mt-8 rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">Daftar isi ({headings.length})</summary>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {headings.map((h) => (
                  <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                    <a href={`#${h.id}`} className="hover:text-brand-primary">{h.text}</a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
      </main>

      <Footer />
    </>
  )
}
