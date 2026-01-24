// Test script to verify SEO agent with new Gemini 3 Pro Image model
import { config } from 'dotenv';
import { generateSEOPages } from './services/seoAgent';

// Load environment variables
config({ path: '.env.local' });

async function testSEOGeneration() {
  console.log('\n🔍 Testing SEO Generation with Gemini 3 Pro Image...');
  console.log('='.repeat(60));
  
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
    console.log('   This will test:');
    console.log('   - SEO keyword research');
    console.log('   - Content generation');
    console.log('   - Image generation (Gemini 3 Pro Image)');
    console.log('   - S3 upload');
    console.log('   - Database saving\n');
    
    const startTime = Date.now();
    const result = await generateSEOPages();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n📊 Results:');
    console.log(`   Duration: ${duration}s`);
    console.log(`   Researched: ${result.researched}`);
    console.log(`   Generated: ${result.generated}`);
    console.log(`   Errors: ${result.errors}`);
    
    if (result.generated > 0) {
      console.log('\n✅ SEO generation completed successfully!');
      console.log(`   Generated ${result.generated} new SEO page(s) with Gemini 3 Pro Image`);
    } else if (result.researched > 0 && result.generated === 0) {
      console.log('\nℹ️  SEO research completed, but no new pages generated');
      console.log('   This is normal if pages already exist or no opportunities found');
    } else if (result.errors > 0) {
      console.log('\n⚠️  SEO generation completed with errors');
      console.log(`   ${result.errors} error(s) occurred`);
    } else {
      console.log('\nℹ️  No SEO opportunities found or all already exist');
    }
  } catch (error) {
    console.error('\n❌ SEO generation failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('\n   Stack trace:');
        console.error(error.stack);
      }
    }
  }
}

// Run the test
testSEOGeneration()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
