// API route for trending tools - GET /api/tools/trending
import { NextRequest, NextResponse } from 'next/server';
import { ToolsRepository } from '@/database/repositories/tools.repository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 8;

    const toolsRepo = new ToolsRepository();
    const tools = await toolsRepo.findTrending(limit);

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error fetching trending tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tools' },
      { status: 500 }
    );
  }
}

