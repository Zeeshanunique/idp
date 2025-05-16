/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental Server Actions feature required by Clerk
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Proxy to Backend
      },
    ]
  },
  // Increase bodyParser limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig