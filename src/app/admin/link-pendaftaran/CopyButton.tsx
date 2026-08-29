'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* noop */
        }
      }}
      className="text-gray-400 hover:text-brand-primary transition-colors"
      title="Salin URL"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
