/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai',
  },
  // Enable server-side rendering
  experimental: {
    serverActions: true,
  },
  // SEO optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [],
  },
  // Redirects for SEO
  async redirects() {
    return [
      // Redirect old 2025 SEO page URLs to 2026
      {
        source: '/seo/top-chatgpt-alternatives-in-2025',
        destination: '/seo/top-chatgpt-alternatives-in-2026',
        permanent: true, // 301 redirect
      },
      {
        source: '/seo/best-ai-writing-tools-2025',
        destination: '/seo/best-ai-writing-tools-2026',
        permanent: true,
      },
      {
        source: '/seo/best-ai-coding-tools-2025',
        destination: '/seo/best-ai-coding-tools-2026',
        permanent: true,
      },
      {
        source: '/seo/ai-research-tools-2025',
        destination: '/seo/ai-research-tools-2026',
        permanent: true,
      },
    ];
  },
  // Headers for SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

