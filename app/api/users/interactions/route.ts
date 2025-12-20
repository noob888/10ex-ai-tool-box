// API route for user tool interactions - POST /api/users/interactions
import { NextRequest, NextResponse } from 'next/server';
import { UsersRepository } from '@/database/repositories/users.repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, toolId, interactionType, action } = body;

    if (!userId || !toolId || !interactionType) {
      return NextResponse.json(
        { error: 'userId, toolId, and interactionType are required' },
        { status: 400 }
      );
    }

    if (!['like', 'star', 'bookmark'].includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
        { status: 400 }
      );
    }

    const usersRepo = new UsersRepository();

    if (action === 'remove') {
      await usersRepo.removeInteraction(userId, toolId, interactionType);
    } else {
      await usersRepo.addInteraction(userId, toolId, interactionType);
      
      // Update user points
      const user = await usersRepo.findById(userId);
      if (user) {
        await usersRepo.updatePoints(userId, user.points + 2);
      }
    }

    // Return updated user
    const updatedUser = await usersRepo.findById(userId);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
}

