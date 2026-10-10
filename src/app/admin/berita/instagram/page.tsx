import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import { InstagramAccountCard } from './InstagramAccountCard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Instagram — Admin' }

export default async function InstagramAdminPage() {
  const accounts = await prisma.instagramAccount.findMany({
    orderBy: { id: 'asc' },
    include: { kategori: true, posts: { orderBy: { postedAt: 'desc' }, take: 30 } },
  })

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl">
      <div>
        <Link href="/admin/berita" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-3">
          <ArrowLeft className="h-4 w-4" /> Berita
        </Link>
        <h1 className="text-2xl font-bold text-brand-primary">Instagram</h1>
        <p className="text-sm text-gray-500 mt-1">
          Postingan terbaru akun publik diambil otomatis (paling sering 1 jam sekali) tanpa login/token, lalu ditampilkan
          dengan embed resmi Instagram bersama artikel di Berita Terbaru. Gambar tidak disimpan di server.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Sinkron otomatis membaca halaman embed publik Instagram (±6 postingan terbaru) — bukan API resmi, jadi bisa
        berhenti bila Instagram mengubah halamannya. Bila status menunjukkan error, postingan tetap bisa ditambah manual
        dengan menempel URL postingan.
      </div>

      <div className="space-y-6">
        {accounts.map((a) => (
          <InstagramAccountCard
            key={a.id}
            account={{
              id: a.id,
              username: a.username,
              kategori: a.kategori.nama,
              isActive: a.isActive,
              autoSync: a.autoSync,
              lastSyncAt: a.lastSyncAt?.toISOString() ?? null,
              lastError: a.lastError,
              posts: a.posts.map((p) => ({
                id: p.id,
                shortcode: p.shortcode,
                caption: p.caption,
                postedAt: p.postedAt.toISOString(),
                source: p.source,
                isHidden: p.isHidden,
              })),
            }}
          />
        ))}
      </div>
    </div>
  )
}
