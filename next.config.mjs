/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cqajtlycmxqbpxvmjzey.supabase.co',
      },
    ],
  },
  // Enable compression
  compress: true,
  // Optimize for production
  poweredByHeader: false,
};

export default nextConfig;
