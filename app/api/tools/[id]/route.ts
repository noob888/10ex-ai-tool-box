// API route for individual tool - GET /api/tools/[id]
import { NextRequest, NextResponse } from 'next/server';
import { ToolsRepository } from '@/database/repositories/tools.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const toolsRepo = new ToolsRepository();
    const tool = await toolsRepo.findById(id);

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

