/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['p16-sign-va.tiktokcdn.com', 'p77-sign-va.tiktokcdn.com'],
  },
  // Puppeteer requires server-side execution
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core'],
  },
}

module.exports = nextConfig

