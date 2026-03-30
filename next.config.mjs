/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Exclude jspdf from server-side bundling (uses Node.js-specific modules)
  serverExternalPackages: ['jspdf'],
}

export default nextConfig
