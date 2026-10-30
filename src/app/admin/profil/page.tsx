import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { getProfil } from '@/lib/profil'
import { ProfilForm } from './ProfilForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Profil — Admin' }

export default async function AdminProfilPage() {
  const profil = await getProfil()

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Profil</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Isi halaman <span className="font-mono">/profil</span> yang tampil di website. Gunakan editor
            WYSIWYG di bawah, dan taipkan tautan YouTube pada field video utama untuk memuat video
            profil di bagian atas halaman.
          </p>
        </div>
        <Link
          href="/profil"
          target="_blank"
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" /> Lihat Halaman
        </Link>
      </div>

      <ProfilForm
        initial={{
          konten: profil.konten,
          videoUrl: profil.videoUrl,
          updatedAt: profil.updatedAt ? profil.updatedAt.toISOString() : null,
        }}
      />
    </div>
  )
}
