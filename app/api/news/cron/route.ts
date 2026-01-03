// Cron endpoint to fetch and update news daily
// This should be called by a cron service (Vercel Cron, AWS EventBridge, etc.)
import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNews } from '@/services/newsService';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch and save news
    const result = await fetchAndSaveNews();

    return NextResponse.json({
      success: true,
      message: 'News fetched successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error in news cron job:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}

