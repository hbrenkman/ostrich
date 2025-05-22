/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable middleware debugging
  experimental: {
    instrumentationHook: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8001',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  }
};

export default nextConfig;