import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

export default function robots(): MetadataRoute.Robots {
  if (isStaging) {
    // Staging tidak boleh di-index sama sekali.
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/login',
          '/lupa-password',
          '/reset-password',
          '/uploads/',
          '/*?ref=',
          '/*?id=',
          '/*?closed=1',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
