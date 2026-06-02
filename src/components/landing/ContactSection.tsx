import { Phone, MapPin, Globe, AtSign } from 'lucide-react'

export function ContactSection() {
  return (
    <section id="kontak" className="py-16 px-4 bg-brand-primary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-accent mb-3">Hubungi Kami</h2>
          <p className="text-blue-200">Informasi lebih lanjut tentang pendaftaran dan program</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Phone, label: 'Telepon / WA', value: '0811-1516-756', href: 'https://api.whatsapp.com/send?phone=628111516756' },
            { icon: Globe, label: 'Website', value: 'www.mahadaly.syathiby.id', href: 'https://www.mahadaly.syathiby.id' },
            { icon: AtSign, label: 'Instagram', value: '@mahadalysyathiby', href: 'https://www.instagram.com/mahadalysyathiby' },
            { icon: MapPin, label: 'Alamat', value: 'Kp. Tengah, Cileungsi, Bogor 16820', href: '#' },
          ].map((c, i) => (
            <a key={i} href={c.href} className="bg-white/10 hover:bg-white/20 rounded-xl p-5 transition-colors border border-white/20">
              <c.icon className="h-6 w-6 text-brand-accent mb-3" />
              <p className="text-blue-200 text-xs mb-1">{c.label}</p>
              <p className="font-medium text-sm">{c.value}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
