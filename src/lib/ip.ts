/**
 * Resolver IP klien yang dilihat server.
 *
 * Penting: validasi absen Wi-Fi TIDAK boleh mempercayai IP yang dikirim
 * browser, karena nilai itu bisa dipalsukan oleh siapa pun (cukup kirim
 * POST body `ip` berisi IP Wi-Fi ma'had). IP yang dipakai server adalah
 * IP publik klien yang dilaporkan proxy di depan aplikasi.
 *
 * Urutan sumber (pertama yang tersedia dipakai):
 *   1. `cf-connecting-ip`  -> Cloudflare menimpanya dengan IP klien asli,
 *                              jadi tidak bisa dipalsukan browser.
 *   2. `x-real-ip`         -> diisi reverse proxy asal.
 *   3. `x-forwarded-for`   -> rantai proxy; entri pertama adalah klien asli
 *                              (entri berikutnya adalah proxy di antaranya).
 *   4. `x-client-ip`       -> dipakai beberapa reverse proxy lama.
 *
 * Module ini tidak meng-import Prisma sehingga aman dipakai di client
 * component maupun route handler.
 */

/** Header yang dipakai proxy untuk meneruskan IP klien. */
const HEADER_IP = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
  'x-client-ip',
] as const

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

/** Bersihkan satu nilai IP: potong spasi, port, dan tanda kutip. */
function bersihkanIp(nilai: string | null | undefined): string | null {
  if (!nilai) return null
  let v = nilai.trim()
  if (!v) return null
  // Buang tanda kutip yang kadang ditambahkan proxy.
  v = v.replace(/^"|"$/g, '').trim()
  // "1.2.3.4:5678" -> "1.2.3.4" (header XFF tidak memakai port, tapi aman).
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(v)) v = v.split(':')[0]
  return v || null
}

/**
 * Ambil IP publik klien dari header request.
 * Mengembalikan null bila tidak ada proxy yang meneruskan IP.
 */
export function ipDariRequest(req: Request): string | null {
  const headers = req.headers
  for (const nama of HEADER_IP) {
    const mentah = headers.get(nama)
    if (!mentah) continue
    // XFF bisa berisi rantai "klien, proxy1, proxy2"; entri pertama = klien.
    const kandidat = bersihkanIp(mentah.split(',')[0])
    if (kandidat) return kandidat
  }
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
