/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.50.100', 'localhost'],
  // Server produksi hanya menerima .next/ (tanpa npm install): bundel paket ini agar tidak dicari di node_modules server.
  transpilePackages: ['sanitize-html', 'postcss'],
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
