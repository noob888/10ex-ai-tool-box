// API route for fetching news articles
import { NextRequest, NextResponse } from 'next/server';
import { NewsRepository } from '@/database/repositories/news.repository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const category = searchParams.get('category') || undefined;
    const source = searchParams.get('source') || undefined;

    const newsRepo = new NewsRepository();
    const articles = await newsRepo.findAll({
      limit: Math.min(limit, 50), // Max 50 articles
      featured,
      category,
      source,
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

