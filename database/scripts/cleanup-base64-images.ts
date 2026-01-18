// Cleanup script to upload base64 images to S3 and update URLs
// Base64 images are too large and cause 413 errors
// Run: npm run db:cleanup-base64-images

import { SEOPagesRepository } from '../repositories/seoPages.repository';
import { getDatabasePool } from '../connection';
import { uploadImageToS3, generateImageFilename } from '../../services/s3Service';

async function cleanupBase64Images() {
  const seoPagesRepo = new SEOPagesRepository();
  const pool = getDatabasePool();
  
  try {
    console.log('🔍 Finding SEO pages with base64 images...');
    
    // Get all SEO pages
    const pages = await seoPagesRepo.findAll();
    
    let updated = 0;
    let skipped = 0;
    const base64Pattern = /^data:image\//;
    
    for (const page of pages) {
      if (page.featuredImageUrl && base64Pattern.test(page.featuredImageUrl)) {
        console.log(`\n   📄 Processing page: ${page.slug}`);
        console.log(`      Keyword: ${page.keyword}`);
        
        try {
          // Extract mime type and base64 data
          const match = page.featuredImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!match) {
            console.log(`      ⚠️  Invalid base64 format, skipping...`);
            skipped++;
            continue;
          }
          
          const mimeType = match[1];
          const base64Data = match[2];
          const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;
          
          // Generate filename
          const filename = generateImageFilename(page.keyword, extension);
          
          // Upload to S3
          console.log(`      📤 Uploading to S3...`);
          const s3Url = await uploadImageToS3(base64Data, filename, `image/${mimeType}`);
          
          if (s3Url) {
            // Update the page with S3 URL
            await pool.query(
              'UPDATE toolbox_seo_pages SET featured_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE slug = $2',
              [s3Url, page.slug]
            );
            
            console.log(`      ✅ Updated ${page.slug} with S3 URL: ${s3Url}`);
            updated++;
          } else {
            console.log(`      ⚠️  S3 upload failed, using placeholder...`);
            // Fallback to placeholder
            const keyword = page.keyword.toLowerCase()
              .replace(/best |top |for |in |2026|ai |tools?/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 50);
            const seed = Buffer.from(keyword).toString('base64').substring(0, 10);
            const placeholderUrl = `https://picsum.photos/seed/${seed}/1200/630`;
            
            await pool.query(
              'UPDATE toolbox_seo_pages SET featured_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE slug = $2',
              [placeholderUrl, page.slug]
            );
            
            console.log(`      ✅ Updated ${page.slug} with placeholder URL`);
            updated++;
          }
        } catch (error: any) {
          console.error(`      ❌ Error processing ${page.slug}:`, error?.message || error);
          skipped++;
        }
      }
    }
    
    console.log(`\n✅ Cleanup complete:`);
    console.log(`   - Updated: ${updated} pages`);
    console.log(`   - Skipped: ${skipped} pages`);
  } catch (error) {
    console.error('❌ Error cleaning up base64 images:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupBase64Images()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupBase64Images };
