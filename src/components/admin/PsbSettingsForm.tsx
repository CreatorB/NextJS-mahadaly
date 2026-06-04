'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Props {
  info: Record<string, unknown>
}

export function PsbSettingsForm({ info }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    statusPsb: (info.statusPsb as string) ?? 'Tutup',
    datetimeOpen: info.datetimeOpen ? new Date(info.datetimeOpen as string).toISOString().slice(0, 16) : '',
    datetimeClosed: info.datetimeClosed ? new Date(info.datetimeClosed as string).toISOString().slice(0, 16) : '',
    quotaIkhwan: String(info.quotaIkhwan ?? ''),
    quotaAkhwat: String(info.quotaAkhwat ?? ''),
    biayaPendaftaran: String(info.biayaPendaftaran ?? 150000),
    biayaPangkal: String(info.biayaPangkal ?? 5250000),
    biayaKuliahSemester: String(info.biayaKuliahSemester ?? 3000000),
    biayaCicilanBulanan: String(info.biayaCicilanBulanan ?? 500000),
    linkGroup: (info.linkGroup as string) ?? '',
    kontenPsb: (info.kontenPsb as string) ?? '',
    linkPoster: (info.posterImages as string) ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/psb-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengaturan berhasil disimpan')
        router.refresh()
      } else {
        toast.error(json.message)
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-brand-primary">Status & Jadwal</h3>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status PSB</label>
          <select value={form.statusPsb} onChange={set('statusPsb')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="Buka">Buka</option>
            <option value="Tutup">Tutup</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Dibuka Mulai" type="datetime-local" value={form.datetimeOpen} onChange={set('datetimeOpen')} />
          <Input label="Ditutup Pada" type="datetime-local" value={form.datetimeClosed} onChange={set('datetimeClosed')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Kuota Ikhwan" type="number" value={form.quotaIkhwan} onChange={set('quotaIkhwan')} placeholder="Kosong = unlimited" />
          <Input label="Kuota Akhwat" type="number" value={form.quotaAkhwat} onChange={set('quotaAkhwat')} placeholder="Kosong = unlimited" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-brand-primary">Biaya</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Biaya Pendaftaran (Rp)" type="number" value={form.biayaPendaftaran} onChange={set('biayaPendaftaran')} />
          <Input label="Uang Pangkal (Rp)" type="number" value={form.biayaPangkal} onChange={set('biayaPangkal')} />
          <Input label="Biaya Kuliah/Semester (Rp)" type="number" value={form.biayaKuliahSemester} onChange={set('biayaKuliahSemester')} />
          <Input label="Cicilan/Bulan (Rp)" type="number" value={form.biayaCicilanBulanan} onChange={set('biayaCicilanBulanan')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-brand-primary">Link Grup WhatsApp</h3>
        <Input label="Link Grup (ditampilkan setelah pembayaran diverifikasi)" value={form.linkGroup} onChange={set('linkGroup')} placeholder="https://chat.whatsapp.com/..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-brand-primary">Poster PSB</h3>
        <Input label="URL Poster (link gambar poster PSB)" type="url" value={form.linkPoster} onChange={set('linkPoster')} placeholder="https://..." />
        {form.linkPoster && (
          <div className="mt-2">
            <p className="mb-2 text-xs text-gray-500">Preview:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.linkPoster} alt="Preview poster" className="max-h-64 rounded-lg border border-gray-200 object-contain" />
          </div>
        )}
        <p className="text-xs text-gray-400">Poster ditampilkan di halaman PSB dan dapat dilihat fullscreen oleh pendaftar.</p>
      </div>

      <Button type="submit" loading={loading} size="lg">
        <Save className="h-4 w-4" /> Simpan Pengaturan
      </Button>
    </form>
  )
}
