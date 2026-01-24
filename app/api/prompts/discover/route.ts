// API endpoint for AI prompts discovery (fire-and-forget pattern)
import { NextRequest, NextResponse } from 'next/server';
import { discoverAndSavePrompts } from '@/services/promptsAgent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Optional: Check for CRON_SECRET authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fire-and-forget: Start discovery in background, return immediately
    discoverAndSavePrompts()
      .then((result) => {
        console.log('✅ Prompts discovery completed:', result);
      })
      .catch((error) => {
        console.error('❌ Prompts discovery failed:', error);
      });

    // Return 202 Accepted immediately
    return NextResponse.json(
      { 
        message: 'Prompts discovery started',
        status: 'accepted'
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error starting prompts discovery:', error);
    return NextResponse.json(
      { error: 'Failed to start prompts discovery', details: error.message },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}
