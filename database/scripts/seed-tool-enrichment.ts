// Script to generate and seed FAQs and use cases for all tools
// Run this once to populate the database with enriched content

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

import { ToolsRepository } from '../repositories/tools.repository';
import { generateToolFAQ, generateToolUseCases } from '../../services/toolEnrichmentService';

async function seedToolEnrichment() {
  const toolsRepo = new ToolsRepository();
  
  console.log('🚀 Starting tool enrichment seeding...\n');

  // Get all tools that need enrichment
  const tools = await toolsRepo.findToolsNeedingEnrichment(1000);
  
  console.log(`📊 Found ${tools.length} tools to enrich\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    console.log(`[${i + 1}/${tools.length}] Processing: ${tool.name}...`);

    try {
      // Check if already has FAQs and use cases
      const enrichment = await toolsRepo.getEnrichment(tool.id);
      const needsFAQs = !enrichment.faqs || enrichment.faqs.length === 0;
      const needsUseCases = !enrichment.useCases || enrichment.useCases.length === 0;

      if (!needsFAQs && !needsUseCases) {
        console.log(`  ⏭️  Already enriched, skipping\n`);
        skippedCount++;
        continue;
      }

      // Generate FAQs if needed
      if (needsFAQs) {
        console.log(`  📝 Generating FAQs...`);
        const faqs = await generateToolFAQ(tool);
        if (faqs.length > 0) {
          await toolsRepo.updateFAQs(tool.id, faqs);
          console.log(`  ✅ Generated ${faqs.length} FAQs`);
        } else {
          console.log(`  ⚠️  No FAQs generated`);
        }
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Generate use cases if needed
      if (needsUseCases) {
        console.log(`  🎯 Generating use cases...`);
        const useCases = await generateToolUseCases(tool);
        if (useCases.length > 0) {
          await toolsRepo.updateUseCases(tool.id, useCases);
          console.log(`  ✅ Generated ${useCases.length} use cases`);
        } else {
          console.log(`  ⚠️  No use cases generated`);
        }
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      successCount++;
      console.log(`  ✨ Completed!\n`);
    } catch (error: any) {
      errorCount++;
      console.error(`  ❌ Error: ${error.message}\n`);
      
      // If rate limited, wait longer
      if (error.status === 429 || error.message?.includes('quota')) {
        console.log(`  ⏳ Rate limited, waiting 60 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Seeding complete!`);
}

// Run the script
seedToolEnrichment()
  .then(() => {
    console.log('\n✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
