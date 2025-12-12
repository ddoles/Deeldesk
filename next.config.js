/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},
};

module.exports = nextConfig;
