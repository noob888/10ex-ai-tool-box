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
    const headers = [
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

    // In dev, avoid stale chunk caching causing ChunkLoadError timeouts.
    // (In prod, Next serves fingerprinted assets and caching is desirable.)
    if (process.env.NODE_ENV !== 'production') {
      headers.unshift({
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      });
    }

    return headers;
  },
}

module.exports = nextConfig

