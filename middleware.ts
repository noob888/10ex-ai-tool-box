import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Map query parameters to SEO page slugs
const queryToSlugMap: Record<string, string> = {
  // 2026 SEO pages
  'top-chatgpt-alternatives-in-2026': 'top-chatgpt-alternatives-in-2026',
  'best-ai-writing-tools-2026': 'best-ai-writing-tools-2026',
  'best-ai-coding-tools-2026': 'best-ai-coding-tools-2026',
  'ai-research-tools-2026': 'ai-research-tools-2026',
  'free-ai-tools-for-startups': 'free-ai-tools-for-startups',
  'best-ai-tools-comparison': 'best-ai-tools-comparison',
  'ai-design-tools-for-creators': 'ai-design-tools-for-creators',
  'ai-video-generation-tools': 'ai-video-generation-tools',
  'ai-marketing-tools-for-business': 'ai-marketing-tools-for-business',
  'ai-sales-tools-outreach': 'ai-sales-tools-outreach',
  'ai-productivity-tools': 'ai-productivity-tools',
  'ai-automation-tools': 'ai-automation-tools',
  // Legacy 2025 redirects (redirect to 2026 versions)
  'top-chatgpt-alternatives-in-2025': 'top-chatgpt-alternatives-in-2026',
  'best-ai-writing-tools-2025': 'best-ai-writing-tools-2026',
  'best-ai-coding-tools-2025': 'best-ai-coding-tools-2026',
  'ai-research-tools-2025': 'ai-research-tools-2026',
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Consolidate /agents → /ai-agents (canonical) to fix duplicate content in GSC
  if (pathname === '/agents' || pathname === '/agents/') {
    return NextResponse.redirect(new URL('/ai-agents', request.url), 301);
  }
  if (pathname === '/agents/email-template-generator' || pathname === '/agents/email-template-generator/') {
    return NextResponse.redirect(new URL('/ai-agents/email-template-generator', request.url), 301);
  }
  if (pathname === '/agents/lead-magnet-generator' || pathname === '/agents/lead-magnet-generator/') {
    return NextResponse.redirect(new URL('/ai-agents/lead-magnet-generator', request.url), 301);
  }

  // Redirect old /seo/ URLs to /blog/
  if (pathname.startsWith('/seo/')) {
    const slug = pathname.replace('/seo/', '');
    const url = request.nextUrl.clone();
    url.pathname = `/blog/${slug}`;
    return NextResponse.redirect(url, 301); // Permanent redirect for SEO
  }

  // Handle query parameter redirects (e.g., /?q=best-ai-tools-2026)
  const queryParam = searchParams.get('q');
  if (queryParam && pathname === '/') {
    const slug = queryToSlugMap[queryParam];
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/blog/${slug}`;
      url.search = ''; // Remove query parameters
      return NextResponse.redirect(url, 301); // Permanent redirect for SEO
    }
  }

  // Continue with the request if no redirect is needed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};

