// API route for users - POST /api/users (create), GET /api/users?email=... (find by email)
import { NextRequest, NextResponse } from 'next/server';
import { UsersRepository } from '@/database/repositories/users.repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const usersRepo = new UsersRepository();
    
    // Check if user already exists
    const existingUser = await usersRepo.findByEmail(email);
    if (existingUser) {
      return NextResponse.json({ user: existingUser });
    }

    // Create new user
    const id = 'u-' + Math.random().toString(36).substr(2, 9);
    const referralCode = 'BETA-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    const user = await usersRepo.create({
      id,
      name,
      email,
      referralCode,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email or id is required' },
        { status: 400 }
      );
    }

    const usersRepo = new UsersRepository();
    const user = id
      ? await usersRepo.findById(id)
      : await usersRepo.findByEmail(email!);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

