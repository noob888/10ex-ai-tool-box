/** @type {import('next').NextConfig} */
const nextConfig = {
      reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai',
  },
      // Server Actions are enabled by default in Next.js 15
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
          // Redirect all /seo/ URLs to /blog/ (catch-all)
          {
            source: '/seo/:path*',
            destination: '/blog/:path*',
            permanent: true, // 301 redirect
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

