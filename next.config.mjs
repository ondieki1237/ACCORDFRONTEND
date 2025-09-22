/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',   // ✅ forces Next.js to generate /out
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
