import Image from 'next/image'
import { MapPin, Phone, Globe, AtSign } from 'lucide-react'

export function Footer() {
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
              <h3 className="font-bold text-brand-accent text-sm sm:text-base lg:text-lg mb-1">Ma'had Aly Al-Imam Asy-Syathiby</h3>
              <p className="text-xs sm:text-sm text-blue-200 leading-tight">Program Studi Hukum Keluarga Islam (HKI) / Ahwal Syakhsiyyah S1</p>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5 leading-tight">Penyelenggara: Yayasan Cahaya Sunnah</p>
            </div>
          </div>
          {/* Kontak Section */}
          <div className="md:w-1/3">
            <h4 className="font-semibold mb-3">Kontak</h4>
            <div className="flex flex-col gap-2 text-sm text-blue-200">
              <a href="tel:08111516756" className="flex items-center gap-2 hover:text-white">
                <Phone className="h-4 w-4" /> 0811-1516-756
              </a>
              <a href="https://www.mahadaly.syathiby.id" className="flex items-center gap-2 hover:text-white">
                <Globe className="h-4 w-4" /> www.mahadaly.syathiby.id
              </a>
              <span className="flex items-center gap-2">
                <AtSign className="h-4 w-4" /> @mahadalysyathiby
              </span>
            </div>
          </div>
          {/* Alamat Section */}
          <div className="md:w-1/3">
            <h4 className="font-semibold mb-3">Alamat</h4>
            <div className="flex gap-2 text-sm text-blue-200">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Kp. Tengah RT 001 RW 005 (Komplek Mahad Imam Syathiby), Kel. Cileungsi, Kec. Cileungsi, Kab. Bogor, Jawa Barat 16820</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-blue-800 text-center text-xs text-blue-300">
        Made with <span className="text-red-400">&hearts;</span> by{' '}
        <a href="https://syathiby.github.io" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white font-medium">IT Syathiby</a>
        {' '}2024{' '}
        <span className="mx-2">|</span>
        <a href="https://github.com/CreatorB/NextJS-mahadaly" target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Open Source <i className="fab fa-github ml-1" />
        </a>
      </div>
    </footer>
  )
}
