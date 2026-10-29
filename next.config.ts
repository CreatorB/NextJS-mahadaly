/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.50.100', 'localhost'],
  // Server produksi hanya menerima .next/ (tanpa npm install): bundel paket ini agar tidak dicari di node_modules server.
  transpilePackages: ['sanitize-html', 'postcss'],
  turbopack: {
    root: __dirname,
  },
  // URL lama -> URL baru (permanent). Struktur program dipindah ke /program/<slug>
  // pada 29 Okt 2026. Sub-path /kias/daftar, /kias/formulir/*, /psb/daftar SENGAJA
  // tidak dipindah: sudah dipakai peserta & admin (link WA, QR, form).
  async redirects() {
    return [{ source: '/kias', destination: '/program/kias', permanent: true }]
  },
}

module.exports = nextConfig
