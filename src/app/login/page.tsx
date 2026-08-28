'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster, toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState('')
  const [successLink, setSuccessLink] = useState('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
    const logEntry = `[${timestamp}] ${msg}`
    setLogs(prev => [...prev, logEntry])
    // Also save to localStorage for persistence across reloads
    try {
      const existingLogs = JSON.parse(localStorage.getItem('login_logs') || '[]')
      existingLogs.push(logEntry)
      localStorage.setItem('login_logs', JSON.stringify(existingLogs.slice(-50))) // Keep last 50
    } catch {}
    console.log(logEntry)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addLog('✅ Form submitted - preventDefault called')
    addLog(`📧 Email: ${email}`)
    setLoading(true)
    setDebug('Mengirim...')
    setSuccessLink('')
    try {
      addLog('🌐 Fetching /api/auth/login...')
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })
      addLog(`📡 Response status: ${res.status}`)
      setDebug(`Status: ${res.status}`)
      const json = await res.json().catch((err) => {
        addLog(`❌ JSON parse error: ${err}`)
        return null
      })
      addLog(`📦 Response JSON: ${JSON.stringify(json).slice(0, 100)}...`)
      const debugSnippet = json ? JSON.stringify(json).slice(0, 200) : 'null'
      setDebug(`Status: ${res.status}, JSON: ${debugSnippet}`)

      if (!json) {
        addLog('❌ No JSON response')
        toast.error('Server tidak mengembalikan response valid')
        setDebug('ERROR: json null')
        setLoading(false)
        return
      }

      if (!res.ok) {
        addLog(`❌ HTTP error: ${res.status} - ${json.message}`)
        toast.error(json.message ?? 'Login gagal')
        setDebug(`HTTP ${res.status}: ${json.message}`)
        setLoading(false)
        return
      }

      if (json.success && json.data) {
        const roleId = json.data.roleId
        const target = roleId <= 2 ? '/admin/dashboard' : '/dashboard'
        addLog(`✅ Success! roleId=${roleId}, redirecting to: ${target}`)
        toast.success(`Selamat datang, ${json.data.nama ?? 'User'}!`)
        setDebug(`Success! roleId=${roleId}, target=${target}`)
        setSuccessLink(target)
        setTimeout(() => {
          try {
            addLog(`🔄 window.location.href = ${target}`)
            window.location.href = target
          } catch (e) {
            addLog(`❌ window.location error: ${e}`)
            setDebug(`window.location failed: ${e}, fallback router.push`)
            router.push(target)
          }
        }, 300)
      } else {
        addLog(`❌ Login failed: ${json.message}`)
        toast.error(json.message ?? 'Login gagal')
        setDebug(`Failed: ${json.message}`)
        setLoading(false)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addLog(`💥 Exception: ${msg}`)
      toast.error('Terjadi kesalahan: ' + msg)
      setDebug('Exception: ' + msg)
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <Navbar />
      <main className="min-h-screen bg-brand-surface flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-primary">Login</h1>
              <p className="text-gray-500 text-sm mt-1">Ma'had Aly Al-Imam Asy-Syathiby</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@contoh.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                helpText="Untuk santri baru: gunakan Kode Registrasi sebagai password"
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Login
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Belum mendaftar?{' '}
              <Link href="/psb" className="text-brand-primary font-medium hover:underline">
                Daftar PSB
              </Link>
            </div>

            {successLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-800 mb-1">Login berhasil! Mengalihkan...</p>
                <p className="text-green-700 text-xs mb-1">Tidak dialihkan otomatis?</p>
                <Link href={successLink} className="text-brand-primary font-medium underline text-sm">
                  Klik di sini untuk masuk →
                </Link>
              </div>
            )}

            {debug && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono text-yellow-900 break-all">
                <strong>Debug:</strong> {debug}
              </div>
            )}

            {successLink && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="text-green-800 mb-1">Login berhasil! Mengalihkan...</p>
                <p className="text-green-700 text-xs mb-1">Tidak dialihkan otomatis?</p>
                <Link href={successLink} className="text-brand-primary font-medium underline text-sm">
                  Klik di sini untuk masuk →
                </Link>
              </div>
            )}

            {/* VERSION MARKER - to verify latest code is running */}
            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Version:</strong> 20260828-login-fix-v3 | <strong>Build:</strong> {new Date().toISOString()}
              <br />
              <strong>Code check:</strong> Has addLog={typeof addLog === 'function' ? '✅' : '❌'} | Has logs state={logs.length >= 0 ? '✅' : '❌'}
            </div>

            {/* LOGS PANEL - always visible for debugging */}
            {logs.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs font-mono max-h-64 overflow-y-auto">
                <strong className="text-gray-700">📋 Log file (last {logs.length} entries):</strong>
                <button
                  onClick={() => {
                    const allLogs = logs.join('\n')
                    navigator.clipboard.writeText(allLogs)
                    addLog('📋 Logs copied to clipboard')
                    alert('Logs copied! Paste to share.')
                  }}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  📋 Copy all
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('login_logs')
                    setLogs([])
                    addLog('🗑️ Logs cleared')
                  }}
                  className="ml-2 text-red-600 hover:underline"
                >
                  🗑️ Clear
                </button>
                <div className="mt-2 text-gray-600">
                  {logs.map((log, i) => (
                    <div key={i} className="py-0.5 border-b border-gray-200 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
