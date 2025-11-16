/** @type {import('next').NextConfig} */
const nextConfig = {
  // Not using static export for this mobile (Capacitor) app — allow runtime rendering
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Ignore Capacitor native plugins during SSR/build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@capacitor-community/background-geolocation': false,
      };
    }
    return config;
  },
}

export default nextConfig
