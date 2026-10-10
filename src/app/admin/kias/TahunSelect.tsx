'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export function TahunSelect({ value, options }: { value: string; options: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  return (
    <select
      value={value}
      onChange={(e) => {
        const q = new URLSearchParams(sp.toString())
        q.set('tahun', e.target.value)
        q.delete('page')
        router.push(`${pathname}?${q}`)
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      aria-label="Tahun ajaran"
    >
      {options.map((t) => <option key={t} value={t}>TA {t}</option>)}
    </select>
  )
}
