/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent jspdf/fflate from being bundled into SSR — it uses Node Worker which Turbopack can't resolve
  serverExternalPackages: ['jspdf', 'fflate'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
