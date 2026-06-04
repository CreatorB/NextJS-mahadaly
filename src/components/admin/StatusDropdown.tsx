'use client'
import { ChevronDown } from 'lucide-react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  options: { value: string; label: string }[]
}

export function StatusDropdown({ label, value, onChange, disabled, options }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}