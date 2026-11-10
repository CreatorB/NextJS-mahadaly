import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getHalamanInfoById } from '@/lib/halaman-info'
import { HalamanInfoForm } from '../HalamanInfoForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sunting Halaman Info — Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function AdminInfoEditPage({ params }: Props) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isFinite(numId)) notFound()

  const halaman = await getHalamanInfoById(numId)
  if (!halaman) notFound()

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <Link
          href="/admin/info"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar Info &amp; Panduan
        </Link>
        <h1 className="text-2xl font-bold text-brand-primary">Sunting Halaman Info</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Perubahan langsung tampil di halaman publik begitu disimpan.
        </p>
      </div>

      <HalamanInfoForm
        mode="edit"
        initial={{
          id: halaman.id,
          slug: halaman.slug,
          judul: halaman.judul,
          kategori: halaman.kategori,
          ringkasan: halaman.ringkasan,
          konten: halaman.konten,
          urutan: halaman.urutan,
          tampil: halaman.tampil,
        }}
      />
    </div>
  )
}
