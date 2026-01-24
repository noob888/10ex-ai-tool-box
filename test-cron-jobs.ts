// Test script to verify cron jobs work correctly
import { config } from 'dotenv';
import { fetchAndSaveNews } from './services/newsService';
import { generateSEOPages } from './services/seoAgent';

// Load environment variables
config({ path: '.env.local' });

async function testNewsCron() {
  console.log('\n📰 Testing News Cron Job...');
  console.log('='.repeat(50));
  
  try {
    // Check required env vars
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set');
      return;
    }
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set');
      return;
    }
    
    console.log('✅ Environment variables configured');
    console.log('🚀 Starting news fetch...');
    
    const result = await fetchAndSaveNews();
    
    console.log('\n📊 Results:');
    console.log(`   Fetched: ${result.fetched}`);
    console.log(`   Saved: ${result.saved}`);
    console.log(`   Errors: ${result.errors}`);
    
    if (result.saved > 0) {
      console.log('✅ News cron job completed successfully!');
    } else if (result.errors > 0) {
      console.log('⚠️  News cron job completed with errors');
    } else {
      console.log('ℹ️  No new articles found (this is normal if already up to date)');
    }
  } catch (error) {
    console.error('❌ News cron job failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

async function testSEOCron() {
  console.log('\n🔍 Testing SEO Generation Cron Job...');
  console.log('='.repeat(50));
  
  try {
    // Check required env vars
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set');
      return;
    }
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set');
      return;
    }
    
    console.log('✅ Environment variables configured');
    console.log('🚀 Starting SEO page generation...');
    
    const result = await generateSEOPages();
    
    console.log('\n📊 Results:');
    console.log(`   Researched: ${result.researched}`);
    console.log(`   Generated: ${result.generated}`);
    console.log(`   Errors: ${result.errors}`);
    
    if (result.generated > 0) {
      console.log('✅ SEO cron job completed successfully!');
    } else if (result.errors > 0) {
      console.log('⚠️  SEO cron job completed with errors');
    } else {
      console.log('ℹ️  No new pages generated (may already exist or no opportunities found)');
    }
  } catch (error) {
    console.error('❌ SEO cron job failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

async function main() {
  console.log('🧪 Testing Cron Jobs');
  console.log('='.repeat(50));
  
  // Test news cron
  await testNewsCron();
  
  // Wait a bit before testing SEO
  console.log('\n⏳ Waiting 2 seconds before testing SEO...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test SEO cron
  await testSEOCron();
  
  console.log('\n✅ All tests completed');
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
