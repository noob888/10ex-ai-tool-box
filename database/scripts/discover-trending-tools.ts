// Script to discover and add trending AI tools
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

import { discoverAndSaveTools } from '../../services/toolsAgent';

async function runDiscovery() {
  console.log('🚀 Starting trending tools discovery...\n');
  
  try {
    const result = await discoverAndSaveTools();
    
    console.log('\n📊 Discovery Results:');
    console.log(`   ✅ Discovered: ${result.discovered}`);
    console.log(`   💾 Saved: ${result.saved}`);
    console.log(`   ⏭️  Skipped: ${result.skipped}`);
    console.log(`   ❌ Errors: ${result.errors}`);
    
    if (result.saved > 0) {
      console.log(`\n🎉 Successfully added ${result.saved} new trending tools!`);
    } else {
      console.log('\nℹ️  No new tools were added (may already exist in database).');
    }
  } catch (error: any) {
    console.error('\n❌ Discovery failed:', error.message);
    throw error;
  }
}

runDiscovery()
  .then(() => {
    console.log('\n✅ Discovery complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Discovery failed:', error);
    process.exit(1);
  });
