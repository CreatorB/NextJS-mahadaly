import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'pending' | 'approved' | 'rejected' | 'info' | 'default'
  className?: string
}

const variants = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  )
}

export function statusBadge(status: string) {
  if (status === 'approved') return <Badge variant="approved">Diterima</Badge>
  if (status === 'rejected') return <Badge variant="rejected">Ditolak</Badge>
  return <Badge variant="pending">Menunggu</Badge>
}
