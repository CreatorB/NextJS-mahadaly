'use client'
import { Pin } from 'lucide-react'
import { inputClass, labelClass, type PostFormState, type SetForm } from './types'

interface Props {
  form: PostFormState
  set: SetForm
  dibuat: string
  diubah: string
  postId?: number
}

/** Tab "Lanjutan": penyematan, info waktu, dan penanda artikel. */
export function AdvancedPanel({ form, set, dibuat, diubah, postId }: Props) {
  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.sticky} onChange={(e) => set('sticky', e.target.checked)} className="mt-0.5 rounded" />
        <span>
          <span className="inline-flex items-center gap-1.5">
            <Pin className="h-4 w-4 text-amber-500" /> Sematkan artikel
          </span>
          <span className="block text-xs text-gray-500">Artikel ini naik ke paling atas daftar berita.</span>
        </span>
      </label>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-700">Informasi</p>
        <dl className="space-y-2 text-xs text-gray-600">
          {postId && (
            <div className="flex justify-between gap-4">
              <dt>ID artikel</dt>
              <dd className="font-mono tabular-nums">{postId}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt>Dibuat</dt>
            <dd>{dibuat}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Terakhir diubah</dt>
            <dd>{diubah}</dd>
          </div>
        </dl>
      </div>

      <div>
        <label className={labelClass}>ID post</label>
        <input value={postId ? String(postId) : '—'} readOnly disabled className={`${inputClass} font-mono`} />
      </div>
    </div>
  )
}
