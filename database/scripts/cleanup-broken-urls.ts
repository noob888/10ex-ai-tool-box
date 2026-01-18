// Script to check and clean up existing news articles with broken URLs (404s)
import { config } from 'dotenv';
import { join } from 'path';
import { NewsRepository } from '../repositories/news.repository';
import { closeDatabasePool } from '../connection';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

/**
 * Check if URL is accessible (doesn't return 404)
 */
async function checkUrlAccessible(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Consider 2xx and 3xx as accessible
    const isAccessible = response.status >= 200 && response.status < 400;
    return isAccessible;
  } catch (error: any) {
    // On error, assume accessible (fail open)
    return true;
  }
}

async function cleanupBrokenUrls() {
  const newsRepo = new NewsRepository();
  
  console.log('🔍 Fetching all news articles...');
  const allArticles = await newsRepo.findAll({ limit: 1000 }); // Get up to 1000 articles
  console.log(`   Found ${allArticles.length} articles to check\n`);

  const brokenUrls: Array<{ id: string; title: string; url: string; status: number }> = [];
  const total = allArticles.length;

  for (let i = 0; i < allArticles.length; i++) {
    const article = allArticles[i];
    const progress = `[${i + 1}/${total}]`;
    
    try {
      process.stdout.write(`${progress} Checking: ${article.title.substring(0, 50)}... `);
      
      const isAccessible = await checkUrlAccessible(article.url, 5000);
      
      if (!isAccessible) {
        // Double check with HEAD request to get actual status code
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(article.url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Bot/1.0)' },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          brokenUrls.push({
            id: article.id,
            title: article.title,
            url: article.url,
            status: response.status,
          });
          console.log(`❌ ${response.status}`);
        } catch {
          brokenUrls.push({
            id: article.id,
            title: article.title,
            url: article.url,
            status: 0, // Unknown error
          });
          console.log(`❌ Error`);
        }
      } else {
        console.log(`✅ OK`);
      }
    } catch (error) {
      console.log(`⚠️  Error checking: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Small delay to avoid rate limiting
    if (i < allArticles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total checked: ${allArticles.length}`);
  console.log(`   Broken URLs: ${brokenUrls.length}`);
  console.log(`   Valid URLs: ${allArticles.length - brokenUrls.length}`);

  if (brokenUrls.length > 0) {
    console.log(`\n❌ Broken URLs found:`);
    brokenUrls.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.status}] ${item.title.substring(0, 60)}...`);
      console.log(`      ${item.url}`);
    });

    console.log(`\n🗑️  Deleting ${brokenUrls.length} articles with broken URLs...`);
    
    const idsToDelete = brokenUrls.map(item => item.id);
    let deleted = 0;
    
    try {
      deleted = await newsRepo.deleteByIds(idsToDelete);
      console.log(`   ✅ Deleted ${deleted} articles`);
    } catch (error) {
      console.error(`   ❌ Error deleting articles:`, error);
      // Fallback: delete one by one
      console.log(`   Trying to delete one by one...`);
      for (const item of brokenUrls) {
        try {
          const success = await newsRepo.deleteById(item.id);
          if (success) deleted++;
        } catch (err) {
          console.error(`   Error deleting ${item.id}:`, err);
        }
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deleted} articles`);
  } else {
    console.log(`\n✅ All URLs are accessible! No cleanup needed.`);
  }

  await closeDatabasePool();
}

// Run if called directly
if (require.main === module) {
  cleanupBrokenUrls()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { cleanupBrokenUrls };
