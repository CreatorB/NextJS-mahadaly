/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.50.100', 'localhost'],
  turbopack: {
    root: __dirname,
  },
  outputFileTracingIncludes: {
    '/uploads/**': [path.join(__dirname, 'uploads')],
    '/berkas/**': [path.join(__dirname, 'uploads')],
  },
}

module.exports = nextConfig
