// API route for prompts - GET /api/prompts
import { NextRequest, NextResponse } from 'next/server';
import { PromptsRepository } from '@/database/repositories/prompts.repository';
import { Category } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as Category | 'All' | null;
    const search = searchParams.get('search') || undefined;

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      // Fallback to local data
      const { promptsDataset } = await import('@/data/toolsData');
      let prompts = promptsDataset;
      
      if (category && category !== 'All') {
        prompts = prompts.filter(p => p.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        prompts = prompts.filter(p => 
          p.title.toLowerCase().includes(q) || 
          p.prompt.toLowerCase().includes(q)
        );
      }
      
      return NextResponse.json({ prompts });
    }

    const promptsRepo = new PromptsRepository();
    const prompts = await promptsRepo.findAll({
      category: category || 'All',
      search,
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    // Fallback to local data on error
    try {
      const { promptsDataset } = await import('@/data/toolsData');
      return NextResponse.json({ prompts: promptsDataset });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }
  }
}

