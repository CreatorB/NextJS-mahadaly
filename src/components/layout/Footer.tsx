import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Globe, AtSign } from 'lucide-react'
import { getKontenMap } from '@/lib/konten'

/**
 * Footer situs.
 *
 * Semua teks (alamat, kontak, label menu, tahun hak cipta) disunting dari
 * panel admin (tabel `konten`).
 */
export async function Footer() {
  const konten = await getKontenMap()

  return (
    <footer className="bg-brand-primary text-white py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-6 lg:gap-8">
          {/* Logo + Info Section */}
          <div className="flex flex-row items-center gap-4 md:w-1/3">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 shrink-0">
              <Image
                src="/images/mahadalysyathiby-logo-white-trim.png"
                alt="Logo Ma'had Aly"
                fill
                sizes="(max-width: 640px) 112px, (max-width: 1024px) 128px, 144px"
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-brand-accent text-sm sm:text-base lg:text-lg mb-1">
                Ma&apos;had Aly Al-Imam Asy-Syathiby
              </h3>
              <p className="text-xs sm:text-sm text-blue-200 leading-tight">
                {konten['footer.programLabel']}
              </p>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5 leading-tight">
                {konten['footer.penyelenggara']}
              </p>
            </div>
          </div>
          {/* Kontak Section */}
          <div className="md:w-1/3">
            <h4 className="font-semibold mb-3">{konten['footer.judulKontak']}</h4>
            <div className="flex flex-col gap-2 text-sm text-blue-200">
              <a href={konten['footer.waUrl']} className="flex items-center gap-2 hover:text-white">
                <Phone className="h-4 w-4" /> {konten['footer.wa']}
              </a>
              <a
                href={konten['footer.websiteUrl']}
                className="flex items-center gap-2 hover:text-white"
              >
                <Globe className="h-4 w-4" /> {konten['footer.website']}
              </a>
              <span className="flex items-center gap-2">
                <AtSign className="h-4 w-4" /> {konten['footer.instagram']}
              </span>
            </div>
          </div>
          {/* Program Section */}
          <div className="md:w-1/3">
            <h4 className="font-semibold mb-3">{konten['footer.judulProgram']}</h4>
            <div className="flex flex-col gap-2 text-sm text-blue-200">
              <Link href="/program/hki" className="hover:text-white">
                {konten['footer.linkHki']}
              </Link>
              <Link href="/program/kias" className="hover:text-white">
                {konten['footer.linkKias']}
              </Link>
              <Link href="/program/kias#info-kias" className="hover:text-white">
                {konten['footer.linkKiasInfo']}
              </Link>
              <Link href="/visi-misi" className="hover:text-white">
                {konten['footer.linkVisiMisi']}
              </Link>
              <Link href="/psb" className="hover:text-white">
                {konten['footer.linkPsb']}
              </Link>
              <Link href="/profil" className="hover:text-white">
                {konten['footer.linkProfil']}
              </Link>
              <Link href="/berita" className="hover:text-white">
                {konten['footer.linkBerita']}
              </Link>
              <Link href="/events" className="hover:text-white">
                {konten['footer.linkEvents']}
              </Link>
            </div>
          </div>
          {/* Alamat Section */}
          <div className="md:w-1/3">
            <h4 className="font-semibold mb-3">{konten['footer.judulAlamat']}</h4>
            <div className="flex gap-2 text-sm text-blue-200">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{konten['footer.alamat']}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-blue-800 text-center text-xs text-blue-300">
        Made with <span className="text-red-400">&hearts;</span> by{' '}
        <a
          href="https://syathiby.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-white font-medium"
        >
          IT Syathiby
        </a>{' '}
        {konten['footer.tahun']}{' '}
        <span className="mx-2">|</span>
        <a
          href="https://github.com/CreatorB/NextJS-mahadaly"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          Open Source <i className="fab fa-github ml-1" />
        </a>
      </div>
    </footer>
  )
}
