import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { StagingCookieScript } from '@/components/StagingCookieScript'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: "Ma'had Aly Al-Imam Asy-Syathiby",
  description: "Program Studi Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1",
  icons: {
    icon: '/images/mahadalysyathiby-logo-color.png',
  },
}

// PENTING: hanya render di staging. Kalau NEXT_PUBLIC_APP_URL tidak mengandung 'tes',
// kita skip render komponen ini — kalau tidak, prod akan redirect loop ke /?key=bismillah.
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('tes') ?? false

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {isStaging && <StagingCookieScript />}
        {children}
      </body>
    </html>
  )
}