import type { Metadata } from 'next';
import './globals.css';
import { LoadingProvider } from '@/components/LoadingProvider';
import { TOOLS_COUNT_FALLBACK } from '@/lib/toolsCount';

export const metadata: Metadata = {
  title: {
    default: 'AI Tool Box - Best AI Tools Directory 2026',
    template: '%s | AI Tool Box'
  },
  description: `Discover the best AI tools in 2026. Comprehensive directory of ${TOOLS_COUNT_FALLBACK}+ AI tools including writing tools, design tools, coding assistants, and more. Compare, review, and find your perfect AI stack.`,
  keywords: [
    'AI tools',
    'AI tool directory',
    'best AI tools 2026',
    'AI writing tools',
    'AI design tools',
    'AI coding tools',
    'AI productivity tools',
    'AI automation tools',
    'AI tool comparison',
    'AI tool reviews',
    'AI stack builder'
  ],
  authors: [{ name: '10EX.AI' }],
  creator: '10EX.AI',
  publisher: '10EX.AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai'),
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'AI Tool Box',
    title: 'AI Tool Box - Best AI Tools Directory 2026',
    description: `Discover the best AI tools in 2026. Comprehensive directory of ${TOOLS_COUNT_FALLBACK}+ AI tools including writing tools, design tools, and more.`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Tool Box - Best AI Tools Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tool Box - Best AI Tools Directory 2026',
    description: `Discover the best AI tools in 2026. Comprehensive directory of ${TOOLS_COUNT_FALLBACK}+ AI tools.`,
    images: ['/og-image.png'],
    creator: '@10exai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  category: 'Technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "AI Tool Box",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://tools.10ex.ai",
              "description": `The definitive AI tool directory curated for solo-hackers. Discover ${TOOLS_COUNT_FALLBACK}+ AI tools including writing tools, design tools, and more.`,
              "publisher": {
                "@type": "Organization",
                "name": "10EX.AI",
                "url": "https://10ex.ai"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_SITE_URL || "https://tools.10ex.ai"}/?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
