/**
 * Resolver IP klien yang dilihat server.
 *
 * Penting: validasi absen Wi-Fi TIDAK boleh mempercayai IP yang dikirim
 * browser, karena nilai itu bisa dipalsukan oleh siapa pun (cukup kirim
 * POST body `ip` berisi IP Wi-Fi ma'had). IP yang dipakai server adalah
 * IP publik klien yang dilaporkan proxy di depan aplikasi.
 *
 * Bukti dari trafik produksi nyata (log `logs/login.log` di origin):
 *
 *   1. Browser biasa, tidak memalsukan header:
 *        x-forwarded-for: 103.178.146.156, 172.69.176.31
 *        (IP klien asli, lalu satu hop yang ditambahkan proxy origin)
 *
 *   2. Browser yang memalsukan X-Forwarded-For:
 *        x-forwarded-for: 9.9.9.9,103.178.146.156, 172.64.213.12
 *        (nilai palsu di depan, IP klien asli sesudahnya, lalu hop proxy
 *         origin)
 *
 * Jadi IP klien asli berada di rantai XFF, bukan di body request. Karena
 * browser hanya bisa menyisipkan nilai di depan dan proxy selalu menambah
 * hop di belakang, IP klien asli dicari dengan berjalan dari kanan ke kiri
 * dan melewati entri yang berada di jaringan Cloudflare (hop proxy).
 *
 * `cf-connecting-ip` TIDAK dipakai sebagai sumber utama: uji pada origin
 * menunjukkan header kiriman klien memengaruhi keputusan IP di sisi server,
 * sehingga header itu tidak dapat dianggap kebal pemalsuan. Header tersebut
 * hanya dipakai sebagai cadangan bila tidak ada XFF sama sekali.
 *
 * Module ini tidak meng-import Prisma sehingga aman dipakai di client
 * component maupun route handler.
 */

/** Header yang dipakai proxy untuk meneruskan IP klien. */
const HEADER_CF_IP = 'cf-connecting-ip'
const HEADER_XFF = 'x-forwarded-for'
const HEADER_REAL_IP = 'x-real-ip'

export type SumberIp = 'server' | 'klien' | 'tidak-ada'

export interface IpEfektif {
  /** IP yang dipakai untuk pengecekan whitelist. */
  ip: string | null
  /** Dari mana IP tersebut diperoleh. */
  sumber: SumberIp
  /** IP yang diklaim klien (body request), bila ada. */
  ipKlien: string | null
  /** True bila IP yang dipakai berasal dari klien (mode cadangan). */
  dariKlien: boolean
}

/**
 * Rentang IP Cloudflare (hop proxy). Dipakai untuk melewati entri rantai
 * XFF yang cuma berisi hop proxy, bukan IP klien.
 */
const CIDR_CLOUDFLARE_V4 = [
  '104.16.0.0/13',
  '104.24.0.0/14',
  '131.0.72.0/22',
  '141.101.64.0/18',
  '162.158.0.0/15',
  '172.64.0.0/13',
  '173.245.48.0/20',
  '188.114.96.0/20',
  '190.93.240.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '108.162.192.0/18',
]

/** Prefix IPv6 Cloudflare (32 bit pertama). */
const PREFIX_CLOUDFLARE_V6 = ['2400cb00', '26064700', '2803f800', '2405b500', '24058100', '2a0698c0', '2c0ff248']

/** Bersihkan satu nilai IP: potong spasi dan tanda kutip. */
function bersihkanIp(nilai: string | null | undefined): string | null {
  if (!nilai) return null
  const v = nilai.trim().replace(/^"|"$/g, '').trim()
  return v || null
}

/** Ubah IPv4 menjadi angka 32-bit, atau null bila bukan IPv4 valid. */
function ipv4KeAngka(ip: string): number | null {
  const bagian = ip.split('.')
  if (bagian.length !== 4) return null
  let n = 0
  for (const b of bagian) {
    if (!/^\d{1,3}$/.test(b)) return null
    const v = Number(b)
    if (v > 255) return null
    n = n * 256 + v
  }
  return n
}

/** Ubah "a.b.c.d/len" menjadi [alamat, panjang prefix]. */
function parseCidr(cidr: string): [number, number] | null {
  const [ip, len] = cidr.split('/')
  const alamat = ipv4KeAngka(ip)
  if (alamat === null || !len) return null
  return [alamat, Number(len)]
}

/** Apakah IP berada di salah satu rentang Cloudflare? */
export function ipMilikCloudflare(ip: string): boolean {
  const angka = ipv4KeAngka(ip)
  if (angka !== null) {
    for (const cidr of CIDR_CLOUDFLARE_V4) {
      const parsed = parseCidr(cidr)
      if (!parsed) continue
      const [base, len] = parsed
      if (len === 0) continue
      const mask = len === 32 ? 0xffffffff : ~(0xffffffff >>> len) >>> 0
      if ((angka & mask) >>> 0 === (base & mask) >>> 0) return true
    }
    return false
  }
  // IPv6: bandingkan 32 bit pertama (4 byte) dengan prefix yang terdaftar.
  if (!ip.includes(':')) return false
  const bagian = ip.split(':')
  if (bagian.length < 4) return false
  const heks = bagian
    .slice(0, 4)
    .map((b) => (b === '' ? '0' : b))
    .map((b) => b.padStart(4, '0'))
    .join('')
    .toLowerCase()
  if (heks.length !== 8) return false
  return PREFIX_CLOUDFLARE_V6.some((p) => heks.startsWith(p))
}

/**
 * Ambil IP klien dari rantai XFF.
 *
 * Berjalan dari kanan ke kiri dan melewati entri yang hanya berisi hop proxy
 * (alamat IP milik Cloudflare). Entri pertama yang bukan hop proxy adalah IP
 * klien asli; nilai yang dipalsukan browser ada paling depan dan tidak
 * pernah dipakai.
 */
function ipDariXff(mentah: string | null): string | null {
  if (!mentah) return null
  const bagian = mentah
    .split(',')
    .map((b) => bersihkanIp(b))
    .filter((b): b is string => !!b)
  for (let i = bagian.length - 1; i >= 0; i--) {
    if (ipMilikCloudflare(bagian[i])) continue
    return bagian[i]
  }
  return null
}

/**
 * Ambil IP publik klien dari header request.
 * Mengembalikan null bila tidak ada proxy yang meneruskan IP.
 */
export function ipDariRequest(req: Request): string | null {
  const headers = req.headers

  // 1. Rantai proxy: sumber utama (dibuktikan dari trafik produksi).
  const xff = ipDariXff(headers.get(HEADER_XFF))
  if (xff) return xff

  // 2. Cadangan: hanya dipakai bila tidak ada XFF sama sekali.
  const cf = bersihkanIp(headers.get(HEADER_CF_IP))
  if (cf) return cf

  // 3. Fallback proxy lama.
  const real = bersihkanIp(headers.get(HEADER_REAL_IP))
  if (real) return real

  return null
}

/**
 * Tentukan IP efektif untuk pengecekan absen Wi-Fi.
 *
 * IP dari server (header proxy) bersifat otoritatif. IP yang dikirim klien
 * hanya dipakai sebagai cadangan bila server tidak bisa memastikan IP klien
 * (misalnya aplikasi dijalankan tanpa proxy di depannya) - mode ini ditandai
 * lewat `dariKlien` agar bisa diaudit.
 */
export function ipEfektif(req: Request, ipKlien: string | null | undefined): IpEfektif {
  const ipServer = ipDariRequest(req)
  const ipBody = bersihkanIp(ipKlien)
  if (ipServer) {
    return { ip: ipServer, sumber: 'server', ipKlien: ipBody, dariKlien: false }
  }
  if (ipBody) {
    return { ip: ipBody, sumber: 'klien', ipKlien: ipBody, dariKlien: true }
  }
  return { ip: null, sumber: 'tidak-ada', ipKlien: null, dariKlien: false }
}
