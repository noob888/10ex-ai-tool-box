// Daily update script - runs all discovery and generation tasks
// This script fetches news, discovers tools and prompts, and generates SEO pages

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

import { fetchAndSaveNews } from '../../services/newsService';
import { discoverAndSaveTools } from '../../services/toolsAgent';
import { discoverAndSavePrompts } from '../../services/promptsAgent';
import { generateSEOPages } from '../../services/seoAgent';

interface DailyUpdateResult {
  news: { fetched: number; saved: number; errors: number };
  tools: { discovered: number; saved: number; skipped: number; errors: number };
  prompts: { discovered: number; saved: number; skipped: number; errors: number };
  seo: { researched: number; generated: number; errors: number };
}

async function runDailyUpdate(): Promise<DailyUpdateResult> {
  const startTime = Date.now();
  console.log('\n🚀 Starting Daily Update Script');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const results: DailyUpdateResult = {
    news: { fetched: 0, saved: 0, errors: 0 },
    tools: { discovered: 0, saved: 0, skipped: 0, errors: 0 },
    prompts: { discovered: 0, saved: 0, skipped: 0, errors: 0 },
    seo: { researched: 0, generated: 0, errors: 0 },
  };

  // Step 1: Fetch News
  console.log('📰 Step 1/4: Fetching AI News...');
  console.log('-'.repeat(60));
  try {
    results.news = await fetchAndSaveNews();
    console.log(`✅ News: Fetched ${results.news.fetched}, Saved ${results.news.saved}, Errors ${results.news.errors}\n`);
  } catch (error: any) {
    console.error(`❌ News fetch failed:`, error.message);
    results.news.errors = 1;
  }

  // Small delay between tasks
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Discover Tools
  console.log('🔧 Step 2/4: Discovering Trending AI Tools...');
  console.log('-'.repeat(60));
  try {
    results.tools = await discoverAndSaveTools();
    console.log(`✅ Tools: Discovered ${results.tools.discovered}, Saved ${results.tools.saved}, Skipped ${results.tools.skipped}, Errors ${results.tools.errors}\n`);
  } catch (error: any) {
    console.error(`❌ Tools discovery failed:`, error.message);
    results.tools.errors = 1;
  }

  // Small delay between tasks
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Discover Prompts
  console.log('💬 Step 3/4: Discovering Best AI Prompts...');
  console.log('-'.repeat(60));
  try {
    results.prompts = await discoverAndSavePrompts();
    console.log(`✅ Prompts: Discovered ${results.prompts.discovered}, Saved ${results.prompts.saved}, Skipped ${results.prompts.skipped}, Errors ${results.prompts.errors}\n`);
  } catch (error: any) {
    console.error(`❌ Prompts discovery failed:`, error.message);
    results.prompts.errors = 1;
  }

  // Small delay between tasks
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Generate SEO Pages
  console.log('🔍 Step 4/4: Generating SEO Pages...');
  console.log('-'.repeat(60));
  try {
    results.seo = await generateSEOPages();
    console.log(`✅ SEO: Researched ${results.seo.researched}, Generated ${results.seo.generated}, Errors ${results.seo.errors}\n`);
  } catch (error: any) {
    console.error(`❌ SEO generation failed:`, error.message);
    results.seo.errors = 1;
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('='.repeat(60));
  console.log('📊 Daily Update Summary');
  console.log('='.repeat(60));
  console.log(`⏱️  Total Duration: ${duration}s`);
  console.log(`\n📰 News:      ${results.news.saved} saved, ${results.news.errors} errors`);
  console.log(`🔧 Tools:     ${results.tools.saved} saved, ${results.tools.errors} errors`);
  console.log(`💬 Prompts:   ${results.prompts.saved} saved, ${results.prompts.errors} errors`);
  console.log(`🔍 SEO Pages: ${results.seo.generated} generated, ${results.seo.errors} errors`);
  console.log('='.repeat(60));

  const totalErrors = results.news.errors + results.tools.errors + results.prompts.errors + results.seo.errors;
  if (totalErrors === 0) {
    console.log('✅ All tasks completed successfully!\n');
  } else {
    console.log(`⚠️  Completed with ${totalErrors} error(s)\n`);
  }

  return results;
}

// Run the daily update
runDailyUpdate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error in daily update:', error);
    process.exit(1);
  });
