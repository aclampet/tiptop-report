/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['qrcode'],
  },
  // Skip static generation for all pages — app requires runtime env vars
  output: 'standalone',
}

module.exports = nextConfig
