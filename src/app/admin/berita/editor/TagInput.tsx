'use client'
import { useState } from 'react'
import { X, Plus } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  suggestions: { id: number; slug: string; nama: string }[]
}

/**
 * Input tag: ketik nama, Enter untuk menambah. Tag yang belum ada dibuat
 * otomatis di server saat artikel disimpan.
 */
export function TagInput({ value, onChange, suggestions }: Props) {
  const [teks, setTeks] = useState('')

  const saran = teks.trim()
    ? suggestions.filter(
        (s) =>
          !value.includes(s.nama) &&
          s.nama.toLowerCase().includes(teks.trim().toLowerCase()),
      ).slice(0, 6)
    : []

  function tambah(nama: string) {
    const bersih = nama.trim()
    if (!bersih) return
    if (value.some((v) => v.toLowerCase() === bersih.toLowerCase())) {
      setTeks('')
      return
    }
    onChange([...value, bersih])
    setTeks('')
  }

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand-primary">
              {t}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Hapus tag ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              tambah(teks)
            }
          }}
          placeholder="Tambah tag lalu tekan Enter…"
          className={input}
        />
        {saran.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {saran.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => tambah(s.nama)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span>{s.nama}</span>
                <span className="font-mono text-xs text-gray-400">{s.slug}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => tambah(teks)}
        disabled={!teks.trim()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" /> Tambah tag
      </button>
    </div>
  )
}
