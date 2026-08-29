'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface InitialData {
  id?: number
  slug?: string
  label?: string
  quota?: number | null
  expiresAt?: string | null
  isActive?: boolean
}

interface Props {
  mode: 'create' | 'edit'
  initial?: InitialData
}

export function LinkForm({ mode, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [quotaEnabled, setQuotaEnabled] = useState(initial?.quota != null)
  const [quota, setQuota] = useState(initial?.quota?.toString() ?? '')
  const [expiresEnabled, setExpiresEnabled] = useState(initial?.expiresAt != null)
  const [expiresAt, setExpiresAt] = useState(
    initial?.expiresAt ? initial.expiresAt.slice(0, 16) : '',
  )
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      slug,
      label,
      isActive,
    }
    if (quotaEnabled) payload.quota = quota ? parseInt(quota, 10) : null
    else payload.quota = null
    if (expiresEnabled && expiresAt) payload.expiresAt = new Date(expiresAt).toISOString()
    else payload.expiresAt = null

    const url =
      mode === 'create'
        ? '/api/admin/registration-links'
        : `/api/admin/registration-links/${initial?.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors)
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success(mode === 'create' ? 'Link berhasil dibuat' : 'Link berhasil diperbarui')
      startTransition(() => router.push('/admin/link-pendaftaran'))
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          required
          pattern="[a-z0-9\-]{3,50}"
          placeholder="contoh: susulan-2026"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <p className="text-xs text-gray-500 mt-1">
          URL publik: <code className="font-mono">/psb?id={slug || '<slug>'}</code>
        </p>
        {errors.slug && <p className="text-xs text-red-600 mt-1">{errors.slug[0]}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Label / Keterangan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          maxLength={200}
          placeholder="mis. Pendaftaran Susulan Gelombang 2"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        {errors.label && <p className="text-xs text-red-600 mt-1">{errors.label[0]}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={quotaEnabled}
            onChange={(e) => setQuotaEnabled(e.target.checked)}
            className="rounded border-gray-300"
          />
          Batasi kuota
        </label>
        {quotaEnabled && (
          <input
            type="number"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            min={1}
            placeholder="jumlah pendaftar yang diizinkan"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        )}
        {errors.quota && <p className="text-xs text-red-600 mt-1">{errors.quota[0]}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={expiresEnabled}
            onChange={(e) => setExpiresEnabled(e.target.checked)}
            className="rounded border-gray-300"
          />
          Tentukan tanggal kedaluwarsa
        </label>
        {expiresEnabled && (
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        )}
        {errors.expiresAt && <p className="text-xs text-red-600 mt-1">{errors.expiresAt[0]}</p>}
      </div>

      {mode === 'edit' && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Link aktif (bisa diakses publik)
          </label>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Link
          href="/admin/link-pendaftaran"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <button
          type="submit"
          disabled={submitting || pending}
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {submitting || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === 'create' ? 'Buat Link' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
