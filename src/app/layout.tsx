import type { Metadata } from 'next'
import { Geist, Amiri } from 'next/font/google'
import { Toaster } from 'sonner'
import { StagingCookieScript } from '@/components/StagingCookieScript'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
// Font Arab (naskh) untuk kalimat arabic pada modal sambutan landing page.
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri' })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mahadaly.syathiby.id'
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Ma'had Aly Al-Imam Asy-Syathiby",
    template: "%s — Ma'had Aly Asy-Syathiby",
  },
  description:
    "Ma'had Aly Al-Imam Asy-Syathiby — pusat kajian ilmu syar'i & bahasa Arab di Cileungsi, Bogor. Program Hukum Keluarga Islam (HKI) S1 berijazah 4 tahun dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i) untuk ikhwan & akhwat.",
  keywords: [
    "Ma'had Aly",
    "Asy-Syathiby",
    'Hukum Keluarga Islam',
    'HKI',
    'KIAS',
    'ilmu syar\'i',
    'bahasa Arab',
    'Cileungsi',
    'Bogor',
    'santri',
    'mahad aly',
  ],
  applicationName: "Ma'had Aly Al-Imam Asy-Syathiby",
  authors: [{ name: 'Yayasan Cahaya Sunnah' }],
  creator: 'Yayasan Cahaya Sunnah',
  publisher: 'Yayasan Cahaya Sunnah',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: "Ma'had Aly Al-Imam Asy-Syathiby",
    title: "Ma'had Aly Al-Imam Asy-Syathiby",
    description:
      "Pusat kajian ilmu syar'i & bahasa Arab. Program Hukum Keluarga Islam (HKI) S1 berijazah 4 tahun dan KIAS (Kursus Ilmu Bahasa Arab & Syar'i).",
    url: '/',
    images: [
      {
        url: '/images/mahadalysyathiby-logo-landscape-name-color-trim.png',
        width: 4361,
        height: 1496,
        alt: "Ma'had Aly Al-Imam Asy-Syathiby",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ma'had Aly Al-Imam Asy-Syathiby",
    description:
      "Pusat kajian ilmu syar'i & bahasa Arab. Program HKI S1 berijazah dan KIAS.",
    images: ['/images/mahadalysyathiby-logo-landscape-name-color-trim.png'],
  },
  icons: {
    icon: '/images/mahadalysyathiby-logo-color.png',
    apple: '/images/mahadalysyathiby-logo-color.png',
  },
  robots: isStaging
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
    : { index: true, follow: true, googleBot: { index: true, follow: true } },
}

// PENTING: hanya render di staging. Kalau NEXT_PUBLIC_APP_URL tidak mengandung 'tes',
// kita skip render komponen ini — kalau tidak, prod akan redirect loop ke /?key=bismillah.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} ${amiri.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {isStaging && <StagingCookieScript />}
        {children}
        <Toaster richColors position="top-center" />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
