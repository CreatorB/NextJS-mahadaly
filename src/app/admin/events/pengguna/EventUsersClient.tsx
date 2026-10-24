'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Link2, Copy, Check, Search, RefreshCw, ShieldAlert, UserCheck, UserX, X } from 'lucide-react'
import type { ManagedUserDTO } from '@/lib/event-users'

type Row = ManagedUserDTO

const input = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
const AKUN_LABEL: Record<Row['akun'], string> = {
  event: 'Peserta Event',
  santri: 'Santri PSB',
  kias: 'Santri KIAS',
  akun: 'Akun biasa',
}

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/event-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Gagal')
  return json
}

function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        } catch {
          toast.error('Gagal menyalin, salin manual')
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
    >
      {done ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />} {done ? 'Tersalin' : label}
    </button>
  )
}

export function EventUsersClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [result, setResult] = useState<{ user: Row; kind: 'password' | 'link'; value: string } | null>(null)

  const load = useCallback(async (params: { q?: string; type?: string }) => {
    setLoading(true)
    try {
      const search = new URLSearchParams()
      if (params.q) search.set('q', params.q)
      if (params.type && params.type !== 'all') search.set('type', params.type)
      const res = await fetch(`/api/admin/event-users?${search.toString()}`)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message ?? 'Gagal memuat data')
      setRows(json.data as Row[])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => load({ q, type }), 350)
    return () => clearTimeout(t)
  }, [q, type, load])

  const requests = useMemo(() => rows.filter((r) => r.adaRequest), [rows])

  const run = async (
    user: Row,
    body: Record<string, unknown>,
    onDone?: (d: { password?: string; link?: string }) => void,
  ) => {
    setBusyId(user.id)
    try {
      const json = await post(body)
      if (onDone) onDone(json.data as { password?: string; link?: string })
      else toast.success(json.message ?? 'Selesai')
      await load({ q, type })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal')
    } finally {
      setBusyId(null)
    }
  }

  const tempPassword = (user: Row) =>
    run(user, { action: 'temp-password', userId: user.id }, (d) =>
      setResult({ user, kind: 'password', value: d.password ?? '' }),
    )

  const issueLink = (user: Row) =>
    run(user, { action: 'issue-link', userId: user.id }, (d) =>
      setResult({ user, kind: 'link', value: d.link ?? '' }),
    )

  return (
    <div className="space-y-4">
      {/* Permintaan reset password dari pengguna */}
      {requests.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <ShieldAlert className="h-4 w-4" /> Permintaan reset password ({requests.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {requests.map((r) => (
              <li key={`req-${r.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{r.nama}</span> · <span className="text-gray-600">{r.email}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {r.requestAt ? new Date(r.requestAt).toLocaleString('id-ID') : ''}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => issueLink(r)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Buat link reset
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() =>
                      run(r, { action: 'resolve-request', token: r.requestToken }, () => toast.success('Permintaan ditandai selesai'))
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Tandai selesai
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / email pengguna..."
            className={`${input} w-full pl-9`}
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={input} aria-label="Jenis akun">
          <option value="all">Semua jenis akun</option>
          <option value="event">Peserta Event</option>
          <option value="santri">Santri PSB</option>
          <option value="kias">Santri KIAS</option>
        </select>
        <button
          type="button"
          onClick={() => load({ q, type })}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-brand-surface">
            <tr>
              {['Pengguna', 'Jenis akun', 'Event', 'Status', 'Aksi'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Tidak ada pengguna yang cocok.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{r.nama}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {r.roleName}
                    {r.passwordChangedAt ? ` · password diubah ${new Date(r.passwordChangedAt).toLocaleDateString('id-ID')}` : ' · password belum pernah diubah'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{AKUN_LABEL[r.akun]}</span>
                  {r.adaRequest && <span className="ml-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Request</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {r.eventCount > 0 ? (
                    <span title={r.eventList.join(', ')}>{r.eventCount} event</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.isActive ? (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">Aktif</span>
                  ) : (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">Nonaktif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => tempPassword(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Password sementara
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => issueLink(r)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Link2 className="h-3.5 w-3.5" /> Link reset
                    </button>
                    {r.resetToken && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => run(r, { action: 'revoke-link', token: r.resetToken })}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cabut link
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        window.confirm(`${r.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun ${r.email}?`) &&
                        run(r, { action: 'toggle-active', userId: r.id })
                      }
                      title={r.isActive ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                      className="p-1.5 text-gray-400 hover:text-brand-primary disabled:opacity-50"
                    >
                      {r.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal hasil */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setResult(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {result.kind === 'password' ? 'Password sementara' : 'Link reset password'}
                </h3>
                <p className="text-sm text-gray-500">
                  {result.user.nama} · {result.user.email}
                </p>
              </div>
              <button type="button" onClick={() => setResult(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              {result.kind === 'password' ? (
                <>
                  <p className="text-sm text-gray-600">
                    Sampaikan password ini ke pengguna (mis. via WhatsApp). Peserta bisa langsung login lalu daftar event.
                  </p>
                  <p className="mt-3 font-mono text-2xl font-bold tracking-wider text-gray-900">{result.value}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Kirim link ini ke pengguna (via WhatsApp). Berlaku 24 jam dan hanya bisa dipakai sekali.
                  </p>
                  <p className="mt-3 break-all rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700">
                    {result.value}
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <CopyButton text={result.value} label={result.kind === 'password' ? 'Salin password' : 'Salin link'} />
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
