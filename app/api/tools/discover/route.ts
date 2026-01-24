// API endpoint for AI tools discovery (fire-and-forget pattern)
import { NextRequest, NextResponse } from 'next/server';
import { discoverAndSaveTools } from '@/services/toolsAgent';

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
    discoverAndSaveTools()
      .then((result) => {
        console.log('✅ Tools discovery completed:', result);
      })
      .catch((error) => {
        console.error('❌ Tools discovery failed:', error);
      });

    // Return 202 Accepted immediately
    return NextResponse.json(
      { 
        message: 'Tools discovery started',
        status: 'accepted'
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error starting tools discovery:', error);
    return NextResponse.json(
      { error: 'Failed to start tools discovery', details: error.message },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}
