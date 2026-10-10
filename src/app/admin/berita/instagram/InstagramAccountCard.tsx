'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Post {
  id: number
  shortcode: string
  caption: string | null
  postedAt: string
  source: string
  isHidden: boolean
}

interface Account {
  id: number
  username: string
  kategori: string
  isActive: boolean
  autoSync: boolean
  lastSyncAt: string | null
  lastError: string | null
  posts: Post[]
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Gagal')
  return json as { message?: string }
}

export function InstagramAccountCard({ account }: { account: Account }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))

  const run = async (key: string, fn: () => Promise<{ message?: string }>, okMsg?: string) => {
    setBusy(key)
    try {
      const r = await fn()
      if (okMsg || r.message) toast.success(r.message ?? okMsg)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const base = `/api/admin/instagram/${account.id}`

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-orange-400 text-white">
            <Camera className="h-5 w-5" />
          </span>
          <div>
            <a href={`https://www.instagram.com/${account.username}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:underline">
              @{account.username}
            </a>
            <p className="text-xs text-gray-500">Kategori: {account.kategori}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={account.isActive} disabled={!!busy}
              onChange={(e) => run('active', () => call(base, 'PATCH', { isActive: e.target.checked }), 'Tersimpan')}
              className="rounded border-gray-300" />
            Tampilkan di website
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={account.autoSync} disabled={!!busy}
              onChange={(e) => run('auto', () => call(base, 'PATCH', { autoSync: e.target.checked }), 'Tersimpan')}
              className="rounded border-gray-300" />
            Sinkron otomatis
          </label>
          <button type="button" disabled={!!busy} onClick={() => run('sync', () => call(base, 'POST'))}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-50">
            {busy === 'sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sinkron sekarang
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Sinkron terakhir: <strong>{fmt(account.lastSyncAt)}</strong>
        {account.lastError ? <span className="text-red-600"> — {account.lastError}</span> : account.lastSyncAt ? <span className="text-green-700"> — OK</span> : null}
      </p>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          run('add', async () => {
            const r = await call(base, 'POST', { url, postedAt: new Date(`${tanggal}T12:00:00`).toISOString() })
            setUrl('')
            return r
          })
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Tempel URL postingan, mis. https://www.instagram.com/p/XXXXXXXXX/"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          title="Tanggal postingan (untuk urutan tampil)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <button type="submit" disabled={!!busy || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          {busy === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah manual
        </button>
      </form>

      {account.posts.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada postingan tersimpan.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
          {account.posts.map((p) => (
            <li key={p.id} className={`flex items-start gap-3 px-3 py-2.5 text-sm ${p.isHidden ? 'opacity-50' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-gray-800">{p.caption || <em className="text-gray-400">(tanpa caption)</em>}</p>
                <p className="text-xs text-gray-500">
                  {fmt(p.postedAt)} · {p.source === 'manual' ? 'manual' : 'otomatis'}{p.isHidden ? ' · disembunyikan' : ''}
                </p>
              </div>
              <a href={`https://www.instagram.com/p/${p.shortcode}/`} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-500 hover:text-brand-primary" title="Buka di Instagram">
                <ExternalLink className="h-4 w-4" />
              </a>
              <button type="button" disabled={!!busy} title={p.isHidden ? 'Tampilkan' : 'Sembunyikan'}
                onClick={() => run(`h${p.id}`, () => call(`/api/admin/instagram/posts/${p.id}`, 'PATCH', { isHidden: !p.isHidden }))}
                className="p-1 text-gray-500 hover:text-brand-primary">
                {p.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              {p.source === 'manual' && (
                <button type="button" disabled={!!busy} title="Hapus"
                  onClick={() => window.confirm('Hapus postingan ini dari website?') && run(`d${p.id}`, () => call(`/api/admin/instagram/posts/${p.id}`, 'DELETE'))}
                  className="p-1 text-gray-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
