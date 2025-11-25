/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['p16-sign-va.tiktokcdn.com', 'p77-sign-va.tiktokcdn.com'],
  },
  // Puppeteer requires server-side execution only
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-core',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude puppeteer from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

