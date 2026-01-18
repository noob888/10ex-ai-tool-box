// Cron endpoint to generate SEO pages using Claude Agent
// This should be called by a cron service (n8n, AWS EventBridge, etc.)
import { NextRequest, NextResponse } from 'next/server';
import { generateSEOPages } from '@/services/seoAgent';

export const maxDuration = 600; // 10 minutes max execution time for SEO generation

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const jobId = `seo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[SEO-GEN] SEO page generation started at ${new Date().toISOString()} (Job ID: ${jobId})`);
  
  try {
    // Verify cron secret (for security) - optional but recommended
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow bypassing auth if CRON_SECRET is not set (for easier setup)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[SEO-GEN] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Start job in background (fire-and-forget) to avoid Amplify timeout
    generateSEOPages()
      .then((result) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[SEO-GEN] ✅ Job ${jobId} completed in ${duration}s - Researched: ${result.researched}, Generated: ${result.generated}, Errors: ${result.errors}`);
      })
      .catch((error) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`[SEO-GEN] ❌ Job ${jobId} failed after ${duration}s:`, error);
        console.error(`[SEO-GEN] Error details:`, error instanceof Error ? error.message : String(error));
      });

    // Return immediately with 202 Accepted status
    return NextResponse.json({
      success: true,
      message: 'SEO page generation started in background',
      jobId: jobId,
      timestamp: new Date().toISOString(),
      note: 'Job is running asynchronously. Check logs for completion status.',
    }, { status: 202 });
  } catch (error) {
    console.error(`[SEO-GEN] Error starting SEO generation job:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start SEO page generation',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
