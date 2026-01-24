// Script to discover and save best prompts
// Run this to populate the database with trending/popular prompts

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

import { discoverAndSavePrompts } from '../../services/promptsAgent';

async function main() {
  console.log('🚀 Starting prompts discovery...\n');

  try {
    const result = await discoverAndSavePrompts();
    
    console.log('\n📊 Final Results:');
    console.log(`  ✅ Discovered: ${result.discovered}`);
    console.log(`  💾 Saved: ${result.saved}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ❌ Errors: ${result.errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Discovery failed:', error);
    process.exit(1);
  }
}

main();
