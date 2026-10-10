'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus, Loader2, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

export interface EventFormValues {
  id?: number
  title: string
  slug: string
  content: string
  images: string[]
  startDate: string
  endDate: string
  registrationStart: string
  registrationEnd: string
  isPaid: boolean
  price: string
  hasAttendance: boolean
  hasCertificate: boolean
  status: string
  groupIkhwan: string
  groupAkhwat: string
  groupPublic: string
  quotaIkhwan: string
  quotaAkhwat: string
  autoAccept: boolean
}

const toIso = (v: string) => (v ? new Date(v).toISOString() : null)

export function EventForm({ initial }: { initial: EventFormValues }) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) => setV((o) => ({ ...o, [k]: val }))
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k][0]}</p>
  const text = (k: keyof EventFormValues, label: string, type = 'text') => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={String(v[k])} onChange={(e) => set(k, e.target.value as never)} className={input} />
      {err(k)}
    </div>
  )
  const check = (k: 'isPaid' | 'hasAttendance' | 'hasCertificate' | 'autoAccept', label: string) => (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="rounded border-gray-300" /> {label}
    </label>
  )

  const upload = async (file: File | undefined) => {
    if (!file || !v.id) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/events/${v.id}`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message ?? 'Upload gagal')
      set('images', [...v.images, json.data.name])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload gagal')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErrors({})
        const body = {
          ...v,
          slug: v.slug || undefined,
          startDate: toIso(v.startDate) ?? '',
          endDate: toIso(v.endDate) ?? '',
          registrationStart: toIso(v.registrationStart),
          registrationEnd: toIso(v.registrationEnd),
        }
        try {
          const res = await fetch(v.id ? `/api/admin/events/${v.id}` : '/api/admin/events', {
            method: v.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          })
          const json = await res.json()
          if (!res.ok || !json.success) {
            if (json.errors) setErrors(json.errors)
            toast.error(json.message ?? 'Gagal menyimpan')
            return
          }
          toast.success(json.message)
          if (!v.id) router.push(`/admin/events/${json.data.id}`)
          router.refresh()
        } catch {
          toast.error('Terjadi kesalahan jaringan')
        } finally {
          setBusy(false)
        }
      }}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]"
    >
      <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {text('title', 'Judul *')}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi *</label>
          <RichTextEditor value={v.content} onChange={(html) => set('content', html)} />
          {err('content')}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Poster / gambar</label>
          {!v.id && <p className="text-xs text-gray-500">Simpan event dulu untuk mengunggah gambar.</p>}
          <div className="flex flex-wrap gap-3">
            {v.images.map((img) => (
              <div key={img} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/uploads/events/images/${encodeURIComponent(img)}`} alt="" className="h-32 w-24 rounded-lg object-cover bg-gray-100" />
                <button type="button" onClick={() => set('images', v.images.filter((x) => x !== img))}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-600 shadow" title="Lepas gambar">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {v.id && (
              <label className="flex h-32 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-primary">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />} Tambah
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select value={v.status} onChange={(e) => set('status', e.target.value)} className={input}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
              <option value="internal">Internal (hanya lewat link)</option>
              <option value="closed">Ditutup</option>
            </select>
          </div>
          {text('startDate', 'Mulai *', 'datetime-local')}
          {text('endDate', 'Selesai *', 'datetime-local')}
          {text('registrationStart', 'Pendaftaran dibuka (kosong = 30 hari sebelum mulai)', 'datetime-local')}
          {text('registrationEnd', 'Pendaftaran ditutup (kosong = saat mulai)', 'datetime-local')}
          {text('slug', 'Slug URL (otomatis dari judul)')}
        </div>
        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {text('quotaIkhwan', 'Kuota ikhwan', 'number')}
            {text('quotaAkhwat', 'Kuota akhwat', 'number')}
          </div>
          <p className="text-xs text-gray-500">Kosong = tanpa batas.</p>
          {check('isPaid', 'Berbayar (wajib bukti transfer)')}
          {v.isPaid && text('price', 'Biaya (Rp)', 'number')}
          {check('autoAccept', 'Terima otomatis (status langsung valid)')}
          {check('hasAttendance', 'Pakai absensi')}
          {check('hasCertificate', 'Ada sertifikat')}
        </div>
        <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-700">Link grup (tampil ke peserta berstatus valid)</p>
          {text('groupIkhwan', 'Grup ikhwan')}
          {text('groupAkhwat', 'Grup akhwat')}
          {text('groupPublic', 'Grup umum (cadangan)')}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan
          </button>
          {v.id && (
            <button type="button" disabled={busy}
              onClick={async () => {
                if (!window.confirm('Hapus event ini beserta seluruh pendaftar dan absensinya?')) return
                const res = await fetch(`/api/admin/events/${v.id}`, { method: 'DELETE' })
                if (res.ok) { toast.success('Event dihapus'); router.push('/admin/events'); router.refresh() } else toast.error('Gagal menghapus')
              }}
              className="rounded-lg px-3 text-red-600 hover:bg-red-50" title="Hapus event">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
