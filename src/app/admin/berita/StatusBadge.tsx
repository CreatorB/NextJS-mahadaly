import { clsx } from 'clsx'

export interface StatusPost {
  status: string
  publishedAt: Date | null
  noindex?: boolean
}

export function statusOf(p: StatusPost) {
  if (p.status !== 'published') return { label: 'Draft', color: 'bg-gray-200 text-gray-700', tone: 'draft' as const }
  if (p.publishedAt && p.publishedAt > new Date()) {
    return { label: 'Terjadwal', color: 'bg-amber-100 text-amber-800', tone: 'scheduled' as const }
  }
  if (p.noindex) {
    return { label: 'Terbit (tanpa index)', color: 'bg-blue-100 text-blue-800', tone: 'noindex' as const }
  }
  return { label: 'Terbit', color: 'bg-green-100 text-green-800', tone: 'published' as const }
}

export function StatusBadge({ post }: { post: StatusPost }) {
  const st = statusOf(post)
  return (
    <span className={clsx('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', st.color)}>
      {st.label}
    </span>
  )
}
