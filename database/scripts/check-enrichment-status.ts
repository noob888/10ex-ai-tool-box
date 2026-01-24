// Quick script to check enrichment status

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

import { getDatabasePool, closeDatabasePool } from '../connection';

async function checkEnrichmentStatus() {
  const pool = getDatabasePool();

  try {
    // Get total tools count
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM toolbox_tools');
    const totalTools = parseInt(totalResult.rows[0].total);

    // Get tools with FAQs
    const faqsResult = await pool.query(
      `SELECT COUNT(*) as count FROM toolbox_tools 
       WHERE faqs IS NOT NULL AND faqs != '[]'::jsonb AND faqs_generated_at IS NOT NULL`
    );
    const toolsWithFAQs = parseInt(faqsResult.rows[0].count);

    // Get tools with use cases
    const useCasesResult = await pool.query(
      `SELECT COUNT(*) as count FROM toolbox_tools 
       WHERE use_cases IS NOT NULL AND use_cases != '[]'::jsonb AND use_cases_generated_at IS NOT NULL`
    );
    const toolsWithUseCases = parseInt(useCasesResult.rows[0].count);

    // Get tools with both
    const bothResult = await pool.query(
      `SELECT COUNT(*) as count FROM toolbox_tools 
       WHERE (faqs IS NOT NULL AND faqs != '[]'::jsonb AND faqs_generated_at IS NOT NULL)
         AND (use_cases IS NOT NULL AND use_cases != '[]'::jsonb AND use_cases_generated_at IS NOT NULL)`
    );
    const toolsWithBoth = parseInt(bothResult.rows[0].count);

    // Get tools needing enrichment
    const needingResult = await pool.query(
      `SELECT COUNT(*) as count FROM toolbox_tools 
       WHERE (faqs IS NULL OR faqs = '[]'::jsonb OR faqs_generated_at IS NULL)
          OR (use_cases IS NULL OR use_cases = '[]'::jsonb OR use_cases_generated_at IS NULL)`
    );
    const toolsNeedingEnrichment = parseInt(needingResult.rows[0].count);

    console.log('\n📊 Enrichment Status:\n');
    console.log(`Total Tools: ${totalTools}`);
    console.log(`✅ Tools with FAQs: ${toolsWithFAQs} (${((toolsWithFAQs / totalTools) * 100).toFixed(1)}%)`);
    console.log(`✅ Tools with Use Cases: ${toolsWithUseCases} (${((toolsWithUseCases / totalTools) * 100).toFixed(1)}%)`);
    console.log(`✅ Tools with Both: ${toolsWithBoth} (${((toolsWithBoth / totalTools) * 100).toFixed(1)}%)`);
    console.log(`⏳ Tools Needing Enrichment: ${toolsNeedingEnrichment} (${((toolsNeedingEnrichment / totalTools) * 100).toFixed(1)}%)`);
    
    if (toolsNeedingEnrichment === 0) {
      console.log('\n🎉 Seeding is COMPLETE! All tools have been enriched.\n');
    } else {
      console.log(`\n⏳ Seeding in progress... ${toolsNeedingEnrichment} tools remaining.\n`);
    }

    // Show recent enrichment timestamps
    const recentResult = await pool.query(
      `SELECT name, faqs_generated_at, use_cases_generated_at 
       FROM toolbox_tools 
       WHERE faqs_generated_at IS NOT NULL OR use_cases_generated_at IS NOT NULL
       ORDER BY GREATEST(
         COALESCE(faqs_generated_at, '1970-01-01'::timestamp),
         COALESCE(use_cases_generated_at, '1970-01-01'::timestamp)
       ) DESC
       LIMIT 5`
    );

    if (recentResult.rows.length > 0) {
      console.log('📝 Most Recently Enriched Tools:');
      recentResult.rows.forEach((row: any) => {
        console.log(`  - ${row.name}`);
        if (row.faqs_generated_at) {
          console.log(`    FAQs: ${new Date(row.faqs_generated_at).toLocaleString()}`);
        }
        if (row.use_cases_generated_at) {
          console.log(`    Use Cases: ${new Date(row.use_cases_generated_at).toLocaleString()}`);
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error checking enrichment status:', error);
    throw error;
  } finally {
    await closeDatabasePool();
  }
}

checkEnrichmentStatus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
