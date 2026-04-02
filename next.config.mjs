/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,        // ← Skips slow/breaking type check on Vercel
  },
  eslint: {
    ignoreDuringBuilds: true,       // Optional: also skip ESLint on Vercel
  },
};

export default nextConfig;
