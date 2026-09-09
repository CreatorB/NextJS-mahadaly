'use client'
import { useEffect } from 'react'

const STAGING_KEY = 'bismillah'
const STAGING_COOKIE = 'staging_key'
const COOKIE_DAYS = 7

// isStaging: di-include via NEXT_PUBLIC_APP_URL saat build.
// Prod build (NEXT_PUBLIC_APP_URL=https://mahadaly.syathiby.id) → !isStaging → komponen no-op.
// Kalau somehow ter-render di prod (misal layout lupa guard), useEffect tetap skip aman.
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

export function StagingCookieScript() {
  useEffect(() => {
    if (!isStaging) return
    try {
      const url = new URL(window.location.href)
      const key = url.searchParams.get('key')
      const cookies = document.cookie.split('; ')
      const hasCookie = cookies.some((c) => c.indexOf(STAGING_COOKIE + '=' + STAGING_KEY) === 0)

      if (key === STAGING_KEY) {
        const maxAge = COOKIE_DAYS * 24 * 60 * 60
        document.cookie = `${STAGING_COOKIE}=${STAGING_KEY}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
        url.searchParams.delete('key')
        const cleanUrl =
          url.pathname +
          (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') +
          url.hash
        window.history.replaceState({}, '', cleanUrl)
      } else if (!hasCookie && window.top === window.self) {
        window.location.replace('/?key=' + STAGING_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  return null
}