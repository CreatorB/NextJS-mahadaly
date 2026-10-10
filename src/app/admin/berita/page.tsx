import Link from 'next/link'
import { Plus, Camera, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import prisma from '@/lib/prisma'
import { DeletePostButton } from './DeletePostButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Berita — Admin' }

function statusOf(p: { status: string; publishedAt: Date | null }) {
  if (p.status !== 'published') return { label: 'Draft', color: 'bg-gray-200 text-gray-700' }
  if (p.publishedAt && p.publishedAt > new Date()) return { label: 'Terjadwal', color: 'bg-amber-100 text-amber-800' }
  return { label: 'Terbit', color: 'bg-green-100 text-green-800' }
}

export default async function AdminBeritaPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams
  const [kategoriList, posts] = await Promise.all([
    prisma.postKategori.findMany({ orderBy: { id: 'asc' } }),
    prisma.post.findMany({
      where: kategori ? { kategori: { slug: kategori } } : {},
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: { kategori: true, author: { select: { nama: true } } },
    }),
  ])

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Berita</h1>
          <p className="text-sm text-gray-500 mt-1">
            Artikel tampil di Berita Terbaru (beranda untuk kategori Ma&apos;had Aly, halaman /kias untuk KIAS), digabung dengan postingan Instagram.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/berita/instagram"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Camera className="h-4 w-4" /> Instagram
          </Link>
          <Link
            href="/admin/berita/create"
            className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Tulis Berita
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ slug: undefined as string | undefined, nama: 'Semua' }, ...kategoriList].map((k) => (
          <Link
            key={k.slug ?? 'semua'}
            href={k.slug ? `/admin/berita?kategori=${k.slug}` : '/admin/berita'}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              kategori === k.slug ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {k.nama}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Judul</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal Terbit</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Penulis</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Belum ada berita. Klik <strong>Tulis Berita</strong> untuk membuat.
                </td>
              </tr>
            )}
            {posts.map((p) => {
              const st = statusOf(p)
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/berita/${p.id}`} className="font-medium text-brand-primary hover:underline">
                      {p.judul}
                    </Link>
                    <div className="font-mono text-xs text-gray-400">/berita/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.kategori.nama}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.publishedAt ? format(p.publishedAt, 'd MMM yyyy HH:mm', { locale: idLocale }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.author?.nama ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {st.label === 'Terbit' && (
                        <a href={`/berita/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-brand-primary" title="Lihat">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <DeletePostButton id={p.id} judul={p.judul} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
