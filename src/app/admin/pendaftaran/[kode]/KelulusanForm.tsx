'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Save, Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { PREDIKAT_OPTIONS, KELULUSAN_CATATAN_TEMPLATE, PREDIKAT_LULUS_DENGAN_CATATAN } from '@/lib/kelulusan-template'

interface Props {
  kode: string
  initial: {
    kelulusan: string | null
    predikat: string | null
    catatan: string | null
  }
}

export function KelulusanForm({ kode, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [kelulusan, setKelulusan] = useState<string>(initial.kelulusan ?? '')
  const [predikat, setPredikat] = useState<string>(initial.predikat ?? '')
  const [catatan, setCatatan] = useState<string>(initial.catatan ?? '')

  const applyTemplate = () => {
    setCatatan(KELULUSAN_CATATAN_TEMPLATE)
    if (!predikat) setPredikat(PREDIKAT_LULUS_DENGAN_CATATAN)
    if (!kelulusan) setKelulusan('lulus')
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pendaftaran/${kode}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelulusan: kelulusan || null,
          predikat: predikat || null,
          catatan: catatan || null,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'Gagal menyimpan')
        return
      }
      toast.success('Hasil kelulusan disimpan')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Hasil Kelulusan</label>
          <select
            value={kelulusan}
            onChange={(e) => setKelulusan(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">- Belum ditentukan -</option>
            <option value="lulus">Lulus</option>
            <option value="tidak_lulus">Tidak Lulus</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Predikat</label>
          <select
            value={predikat}
            onChange={(e) => setPredikat(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-</option>
            {PREDIKAT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-700">Catatan</label>
          <button
            type="button"
            onClick={applyTemplate}
            className="inline-flex items-center gap-1 text-xs text-brand-secondary hover:underline"
          >
            <Wand2 className="h-3 w-3" /> Gunakan Template Catatan
          </button>
        </div>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
          placeholder="Catatan kelulusan (kosongkan jika tidak ada). Bullet pakai prefix '- ' atau '* '."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving || pending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving || pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Kelulusan
        </button>
      </div>
    </div>
  )
}
