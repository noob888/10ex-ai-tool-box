// API route for tools - GET /api/tools
import { NextRequest, NextResponse } from 'next/server';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { Category } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as Category | null;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      // Fallback to local data
      const { toolsDataset } = await import('@/data/toolsData');
      let tools = toolsDataset;
      
      if (category) {
        tools = tools.filter(t => t.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        tools = tools.filter(t => 
          t.name.toLowerCase().includes(q) || 
          t.tagline.toLowerCase().includes(q)
        );
      }
      if (limit) {
        tools = tools.slice(offset || 0, (offset || 0) + limit);
      }
      
      return NextResponse.json({ tools });
    }

    const toolsRepo = new ToolsRepository();
    const tools = await toolsRepo.findAll({
      category: category || undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    // Fallback to local data on error
    try {
      const { toolsDataset } = await import('@/data/toolsData');
      return NextResponse.json({ tools: toolsDataset });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch tools' },
        { status: 500 }
      );
    }
  }
}

