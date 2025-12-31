/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for Capacitor
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  // PWA settings will be added via next-pwa
};

module.exports = nextConfig;
