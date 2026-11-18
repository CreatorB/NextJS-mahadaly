'use client'
import { useEffect } from 'react'

/**
 * Penghitung dilihat artikel. Panggil sekali per halaman artikel; cookie di
 * sisi server yang mencegah penghitungan berulang dari refresh.
 */
export function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `berita_dilihat_${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch(`/api/berita/${slug}/view`, { method: 'POST', keepalive: true }).catch(() => {})
  }, [slug])

  return null
}
