import Link from 'next/link'
import { Plus, Link2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import prisma from '@/lib/prisma'
import { LinkActions } from './LinkActions'
import { CopyButton } from './CopyButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Link Pendaftaran — Admin' }

function statusOf(link: { isActive: boolean; expiresAt: Date | null; quota: number | null; usedCount: number }) {
  if (!link.isActive) return { label: 'Nonaktif', color: 'bg-gray-200 text-gray-700' }
  if (link.expiresAt && link.expiresAt <= new Date()) return { label: 'Kedaluwarsa', color: 'bg-orange-100 text-orange-800' }
  if (link.quota !== null && link.usedCount >= link.quota) return { label: 'Kuota Penuh', color: 'bg-red-100 text-red-800' }
  return { label: 'Aktif', color: 'bg-green-100 text-green-800' }
}

export default async function LinkPendaftaranPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'

  const links = await prisma.registrationLink.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { nama: true } },
      _count: { select: { pendaftarans: true } },
    },
  })

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Link Pendaftaran</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat tautan khusus untuk pendaftar susulan / undangan. Hanya yang punya tautan valid yang bisa mengakses
            formulir.
          </p>
        </div>
        <Link
          href="/admin/link-pendaftaran/create"
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Link
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-surface border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Label</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kuota</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Kedaluwarsa</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dibuat</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Belum ada link. Klik <strong>Tambah Link</strong> untuk membuat tautan khusus.
                </td>
              </tr>
            )}
            {links.map((l) => {
              const status = statusOf(l)
              const url = `${baseUrl}/psb?id=${l.slug}`
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-gray-400" />
                      <Link href={`/admin/link-pendaftaran/${l.id}`} className="font-medium text-brand-primary hover:underline">
                        {l.slug}
                      </Link>
                      <CopyButton url={url} />
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-gray-400 hover:text-brand-secondary inline-flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      buka
                    </a>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{l.label}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {l.quota === null ? (
                      <span className="text-xs text-gray-400">∞ unlimited</span>
                    ) : (
                      <span>
                        <span className="font-semibold">{l._count.pendaftarans}</span>
                        <span className="text-gray-400"> / {l.quota}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {l.expiresAt ? format(l.expiresAt, 'dd MMM yyyy HH:mm', { locale: idLocale }) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(l.createdAt, 'dd MMM yyyy', { locale: idLocale })}
                    <div className="text-gray-400">{l.createdBy.nama}</div>
                  </td>
                  <td className="px-4 py-3">
                    <LinkActions id={l.id} isActive={l.isActive} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">Cara kerja</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Tautan publik: <code className="font-mono bg-white px-1.5 py-0.5 rounded">/psb?id=&lt;slug&gt;</code></li>
          <li>Pengguna dengan slug valid akan melihat banner &quot;Pendaftaran Khusus&quot; dan dapat mengisi formulir.</li>
          <li>Slug tidak valid / nonaktif / kedaluwarsa / kuota penuh → tampil halaman 404.</li>
          <li>Setelah submit berhasil, counter <code>usedCount</code> bertambah dan pendaftar tercatat dengan <code>registrationLinkId</code>.</li>
        </ul>
      </div>
    </div>
  )
}
