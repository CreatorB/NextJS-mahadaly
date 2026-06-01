import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: "Ma'had Aly Al-Imam Asy-Syathiby",
  description: "Program Studi Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1",
  icons: {
    icon: '/images/mahadalysyathiby-logo-color.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
