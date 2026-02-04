import { MetadataRoute } from 'next';
import { TOOLS_COUNT_FALLBACK } from '@/lib/toolsCount';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Tool Box - AI Tools Directory',
    short_name: 'AI Tool Box',
    description: `Discover the best AI tools in 2026. Comprehensive directory of ${TOOLS_COUNT_FALLBACK}+ AI tools.`,
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

