import Script from 'next/script'

/**
 * Google Analytics 4 (GA4).
 *
 * Aktif hanya kalau env `NEXT_PUBLIC_GA_ID` terisi (format: G-XXXXXXXXXX).
 * Dibiarkan kosong di repo — user memasang ID-nya sendiri lewat env server
 * (tidak pernah di-commit).
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { send_page_view: true });
        `}
      </Script>
    </>
  )
}
