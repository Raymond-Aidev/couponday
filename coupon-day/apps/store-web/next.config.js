/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment: use SSR mode
  // For Capacitor mobile build, change to: output: 'export'
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
