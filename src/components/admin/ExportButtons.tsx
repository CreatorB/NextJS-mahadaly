'use client'
import { useEffect, useMemo, useState } from 'react'
import { Contact, FileSpreadsheet, FileText, X } from 'lucide-react'
import { formatContactName } from '@/lib/export'

const BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50'

/** Tombol unduh file biasa (Excel / CSV) — filter aktif diteruskan lewat `href`. */
export function ExportLink({
  href,
  label,
  kind = 'excel',
}: {
  href: string
  label: string
  kind?: 'excel' | 'csv'
}) {
  const Icon = kind === 'excel' ? FileSpreadsheet : FileText
  return (
    <a href={href} className={BTN} title={label}>
      <Icon className="h-4 w-4" /> {label}
    </a>
  )
}

/**
 * Tombol export kontak (.vcf).
 *
 * Sebelum mengunduh, admin diminta mengonfirmasi **prefix depan** — misalnya "KUI31"
 * untuk event "Kajian Umum Islam" tanggal 31. Nama kontak di HP menjadi
 * `{prefix}_{nama}_{tahun}` sehingga mudah dibedakan antar batch import.
 * Prefix terakhir dipakai disimpan di browser agar tidak diketik ulang.
 */
export function VcfExportButton({
  url,
  params = {},
  suggestedPrefix = '',
  defaultTahun = '',
  previewNames = [],
  storageKey,
  label = 'Export Kontak (.vcf)',
}: {
  url: string
  /** Parameter filter aktif (q/status/...) yang ikut dikirim. */
  params?: Record<string, string | number | undefined>
  suggestedPrefix?: string
  defaultTahun?: string
  /** Contoh nama untuk pratinjau di popup. */
  previewNames?: string[]
  /** Kunci penyimpanan prefix terakhir di localStorage. */
  storageKey: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [prefix, setPrefix] = useState(suggestedPrefix)
  const [tahun, setTahun] = useState(defaultTahun)
  const [withYear, setWithYear] = useState(Boolean(defaultTahun))

  useEffect(() => {
    if (!open) return
    try {
      const saved = window.localStorage.getItem(`vcf-prefix:${storageKey}`)
      setPrefix(saved ?? suggestedPrefix)
    } catch {
      setPrefix(suggestedPrefix)
    }
  }, [open, storageKey, suggestedPrefix])

  const preview = useMemo(
    () =>
      previewNames.slice(0, 3).map((n) =>
        formatContactName(n, { prefix, tahun: withYear ? tahun : '' }),
      ),
    [previewNames, prefix, tahun, withYear],
  )

  const doExport = () => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v))
    q.set('format', 'vcf')
    const p = prefix.trim()
    if (p) q.set('prefix', p)
    if (withYear && tahun.trim()) q.set('tahun', tahun.trim())
    try {
      window.localStorage.setItem(`vcf-prefix:${storageKey}`, p)
    } catch {
      /* localStorage tidak tersedia (mode privat) — abaikan */
    }
    const a = document.createElement('a')
    a.href = `${url}?${q.toString()}`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setOpen(false)
  }

  const input =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={BTN} title="Unduh kontak peserta (vCard)">
        <Contact className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Export Kontak (.vcf)</h3>
                <p className="text-sm text-gray-500">
                  Konfirmasi prefix depan untuk nama kontak. Contoh: <span className="font-mono">KUI31</span> untuk
                  event tanggal 31.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prefix depan</label>
                <div className="flex gap-2">
                  <input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="KUI31"
                    className={input}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setPrefix(suggestedPrefix)}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    title="Pakai saran otomatis"
                  >
                    Saran
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Saran otomatis: <span className="font-mono">{suggestedPrefix || '—'}</span>. Kosongkan bila tidak ingin
                  prefix.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={withYear}
                    onChange={(e) => setWithYear(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  Sertakan tahun
                </label>
                {withYear && (
                  <input
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="2026"
                    className={`${input} w-28`}
                    inputMode="numeric"
                  />
                )}
              </div>

              {preview.length > 0 && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pratinjau nama kontak</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {preview.map((n, i) => (
                      <li key={i} className="font-mono">
                        {n}
                      </li>
                    ))}
                    {previewNames.length > preview.length && (
                      <li className="text-xs text-gray-400">… dan {previewNames.length - preview.length} nama lainnya</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={doExport}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Contact className="h-4 w-4" /> Export .vcf
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
