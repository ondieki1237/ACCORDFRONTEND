/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor mobile app
  output: 'export',
  distDir: 'out',
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
