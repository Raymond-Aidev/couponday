/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment: use standalone mode for smaller image
  // For Capacitor mobile build, change to: output: 'export'
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
};

module.exports = nextConfig;
