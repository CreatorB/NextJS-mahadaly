import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { getHalamanInfoList } from '@/lib/halaman-info'
import { KATEGORI_LABEL } from '@/lib/halaman-info-shared'
import { DeleteInfoButton } from './DeleteInfoButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Info & Panduan — Admin' }

/**
 * Daftar halaman informasi publik (info KIAS, panduan, PSB).
 *
 * Isi setiap halaman disunting lewat editor WYSIWYG di /admin/info/[id].
 */
export default async function AdminInfoPage() {
  const daftar = await getHalamanInfoList()

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Info &amp; Panduan</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Halaman informasi yang tampil di website. Kategori <strong>Info KIAS</strong> muncul di
            halaman program KIAS (alamat <span className="font-mono">/program/kias/&lt;slug&gt;</span>),
            isi disunting dengan editor WYSIWYG.
          </p>
        </div>
        <Link
          href="/admin/info/create"
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Halaman
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Judul</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Urutan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Terakhir Diubah</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Belum ada halaman info. Klik <strong>Tambah Halaman</strong> untuk membuat.
                </td>
              </tr>
            )}
            {daftar.map((h) => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/info/${h.id}`}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    {h.judul}
                  </Link>
                  <div className="font-mono text-xs text-gray-400">/program/kias/{h.slug}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{KATEGORI_LABEL[h.kategori] ?? h.kategori}</td>
                <td className="px-4 py-3 text-gray-600">{h.urutan}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      h.tampil ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {h.tampil ? 'Tampil' : 'Disembunyikan'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {h.updatedAt.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {h.tampil && (
                      <a
                        href={`/program/kias/${h.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-brand-primary"
                        title="Lihat"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <DeleteInfoButton id={h.id} judul={h.judul} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
