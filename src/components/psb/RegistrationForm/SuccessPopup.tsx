'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Copy, AlertCircle } from 'lucide-react'

interface Props {
  kode: string
  nama: string
  email: string
}

export function SuccessPopup({ kode, nama, email }: Props) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(30)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          window.location.href = '/dashboard'
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(kode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pendaftaran Berhasil!</h1>
          <p className="text-gray-600 mt-1">Assalamu'alaikum <strong>{nama}</strong>, pendaftaran Anda telah kami terima.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 font-medium">CATAT NOMOR INI! Anda akan menggunakannya untuk login ke dashboard.</p>
          </div>
        </div>

        <div className="bg-brand-surface rounded-xl p-4 mb-4 border border-brand-primary/20">
          <p className="text-xs text-gray-500 mb-1">Nomor Peserta Anda</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-brand-primary tracking-wider">{kode}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-sm text-brand-secondary hover:text-brand-primary transition-colors"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Login ke Dashboard:</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 min-w-[60px]">Email:</span>
              <span className="font-medium text-gray-800">{email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 min-w-[60px]">Password:</span>
              <span className="font-medium text-gray-800">{kode}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400 mb-3">Redirect otomatis dalam {countdown} detik</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-brand-primary text-white font-semibold py-3 rounded-xl hover:bg-blue-900 transition-colors"
          >
            Redirect Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

