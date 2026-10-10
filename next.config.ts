/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.50.100', 'localhost'],
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
