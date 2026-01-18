// Cron endpoint to fetch and update news daily
// This should be called by a cron service (Vercel Cron, AWS EventBridge, etc.)
// Uses fire-and-forget pattern to avoid Amplify's 30-second timeout limit
import { NextRequest, NextResponse } from 'next/server';
import { fetchAndSaveNews } from '@/services/newsService';

export const maxDuration = 300; // 5 minutes max execution time for cron jobs

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const jobId = `cron-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[CRON] News fetch job started at ${new Date().toISOString()} (Job ID: ${jobId})`);
  
  try {
    // Verify cron secret (for security) - optional but recommended
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow bypassing auth if CRON_SECRET is not set (for easier setup)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Start job in background (fire-and-forget) to avoid Amplify timeout
    // Don't await - this allows the HTTP request to complete immediately
    fetchAndSaveNews()
      .then((result) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[CRON] ✅ Job ${jobId} completed in ${duration}s - Fetched: ${result.fetched}, Saved: ${result.saved}, Errors: ${result.errors}`);
      })
      .catch((error) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[CRON] ❌ Job ${jobId} failed after ${duration}s:`, error);
        console.error(`[CRON] Error details:`, error instanceof Error ? error.message : String(error));
      });

    // Return immediately with 202 Accepted status
    // This prevents 504 Gateway Timeout errors from Amplify's 30-second limit
    return NextResponse.json({
      success: true,
      message: 'News fetch job started in background',
      jobId: jobId,
      timestamp: new Date().toISOString(),
      note: 'Job is running asynchronously. Check logs for completion status.',
    }, { status: 202 }); // 202 Accepted = request accepted, processing asynchronously
  } catch (error) {
    console.error(`[CRON] Error starting cron job:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start news fetch',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services (AWS EventBridge, etc.)
export async function POST(request: NextRequest) {
  return GET(request);
}

