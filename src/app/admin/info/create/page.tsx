import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HalamanInfoForm } from '../HalamanInfoForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tambah Halaman Info — Admin' }

export default function AdminInfoCreatePage() {
  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <Link
          href="/admin/info"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar Info &amp; Panduan
        </Link>
        <h1 className="text-2xl font-bold text-brand-primary">Tambah Halaman Info</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Halaman baru akan mendapat alamat otomatis dari judul (bisa diubah). Isi ditulis dengan
          editor WYSIWYG.
        </p>
      </div>

      <HalamanInfoForm mode="create" />
    </div>
  )
}
