import { LinkForm } from './LinkForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tambah Link Pendaftaran — Admin' }

export default function NewLinkPendaftaranPage() {
  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-primary mb-2">Tambah Link Pendaftaran</h1>
      <p className="text-sm text-gray-500 mb-6">
        Buat tautan khusus untuk dibagikan ke pendaftar susulan. Slug harus unik dan hanya boleh berisi huruf kecil,
        angka, dan dash.
      </p>
      <LinkForm mode="create" />
    </div>
  )
}
