/**
 * Resolver IP klien yang dilihat server.
 *
 * Penting: validasi absen Wi-Fi TIDAK boleh mempercayai IP yang dikirim
 * browser, karena nilai itu bisa dipalsukan oleh siapa pun (cukup kirim
 * POST body `ip` berisi IP Wi-Fi ma'had). IP yang dipakai server adalah
 * IP publik klien yang dilaporkan proxy di depan aplikasi.
 *
 * Rantai header pada deployment ini (Cloudflare -> proxy origin -> Next.js):
 *
 *   x-forwarded-for: <nilai dari browser, bisa dipalsukan>, <IP asli klien>,
 *                    <IP edge Cloudflare>
 *
 * Cloudflare selalu menambahkan IP klien asli setelah nilai yang dikirim
 * browser, dan proxy origin menambahkan satu hop (IP edge Cloudflare).
 * Karena itu IP klien asli adalah entri KEDUA DARI KANAN. Contoh nyata dari
 * log produksi: "10.254.168.6, 103.28.107.41, 104.22.80.137" -> IP asli
 * klien adalah 103.28.107.41 (entri kedua dari kanan), bukan 10.254.168.6
 * yang dipalsukan browser.
 *
 * Sumber yang dipakai berurutan:
 *   1. `cf-connecting-ip` -> Cloudflare menimpanya dengan IP klien asli,
 *      jadi tidak bisa dipalsukan browser.
 *   2. `x-forwarded-for`  -> entri kedua dari kanan (lihat penjelasan di atas).
 *   3. `x-real-ip`        -> dipakai kalau proxy tidak mengirim XFF.
 *   4. Body request (`ip`) -> hanya cadangan bila server tidak menerima IP
 *      klien dari proxy; ditandai agar bisa diaudit admin.
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

/** Bersihkan satu nilai IP: potong spasi dan tanda kutip. */
function bersihkanIp(nilai: string | null | undefined): string | null {
  if (!nilai) return null
  const v = nilai.trim().replace(/^"|"$/g, '').trim()
  return v || null
}

/**
 * Ambil IP klien dari rantai XFF.
 *
 * Entri kedua dari kanan adalah IP klien asli: browser hanya bisa
 * menyisipkan nilai di depan, sedangkan proxy menambahkan hop di belakang.
 */
function ipDariXff(mentah: string | null): string | null {
  if (!mentah) return null
  const bagian = mentah
    .split(',')
    .map((b) => bersihkanIp(b))
    .filter((b): b is string => !!b)
  if (bagian.length === 0) return null
  if (bagian.length === 1) return bagian[0]
  return bagian[bagian.length - 2]
}

/**
 * Ambil IP publik klien dari header request.
 * Mengembalikan null bila tidak ada proxy yang meneruskan IP.
 */
export function ipDariRequest(req: Request): string | null {
  const headers = req.headers

  // 1. Cloudflare: nilai ini ditimpanya Cloudflare, tidak bisa dipalsukan.
  const cf = bersihkanIp(headers.get(HEADER_CF_IP))
  if (cf) return cf

  // 2. Rantai proxy: ambil entri kedua dari kanan.
  const xff = ipDariXff(headers.get(HEADER_XFF))
  if (xff) return xff

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
 * (misalnya aplikasi dijalankan tanpa proxy di depannya) — mode ini ditandai
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
