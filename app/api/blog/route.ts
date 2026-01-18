// API route for fetching blog posts (SEO pages)
import { NextRequest, NextResponse } from 'next/server';
import { SEOPagesRepository } from '@/database/repositories/seoPages.repository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const published = searchParams.get('published') !== 'false';

    const seoPagesRepo = new SEOPagesRepository();
    const blogs = await seoPagesRepo.findAll({
      limit: Math.min(limit, 100),
      published: published,
    });

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}
