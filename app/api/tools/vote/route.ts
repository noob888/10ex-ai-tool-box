// API route for voting on tools - POST /api/tools/vote
import { NextRequest, NextResponse } from 'next/server';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { UsersRepository } from '@/database/repositories/users.repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, userId } = body;

    if (!toolId || !userId) {
      return NextResponse.json(
        { error: 'toolId and userId are required' },
        { status: 400 }
      );
    }

    const toolsRepo = new ToolsRepository();
    const usersRepo = new UsersRepository();

    // Increment tool votes
    await toolsRepo.incrementVotes(toolId);

    // Record user interaction
    await usersRepo.addInteraction(userId, toolId, 'vote');

    // Update user points
    const user = await usersRepo.findById(userId);
    if (user) {
      await usersRepo.updatePoints(userId, user.points + 5);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error voting on tool:', error);
    return NextResponse.json(
      { error: 'Failed to vote on tool' },
      { status: 500 }
    );
  }
}

