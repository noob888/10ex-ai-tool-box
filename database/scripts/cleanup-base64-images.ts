// Cleanup script to upload base64 images to S3 and regenerate images for placeholder URLs
// Base64 images are too large and cause 413 errors
// Run: npm run db:cleanup-base64-images

import { config } from 'dotenv';
import { join } from 'path';
import { SEOPagesRepository } from '../repositories/seoPages.repository';
import { getDatabasePool } from '../connection';
import { uploadImageToS3, generateImageFilename } from '../../services/s3Service';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

/**
 * Generate image using Gemini and upload to S3
 */
async function generateAndUploadImage(keyword: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('      ⚠️  GEMINI_API_KEY not configured, skipping image generation');
    return null;
  }

  try {
    const imagePrompt = `Create a professional, modern featured image for an SEO article about "${keyword}". 
    
Requirements:
- Clean, minimalist design with modern aesthetics
- Professional color scheme (blues, purples, or tech-inspired colors)
- 1200x630 pixels aspect ratio (landscape)
- Abstract or conceptual representation of AI tools and technology
- No text overlays, just visual elements
- High quality, suitable for website header/featured image
- Professional and trustworthy appearance

Style: Modern tech, minimalist, clean, professional`;

    console.log(`      🎨 Generating AI image with Gemini...`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: imagePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const imagePart = parts.find((p: any) => p.inlineData);
        
        if (imagePart?.inlineData?.data) {
          const base64Data = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          const extension = mimeType.split('/')[1] || 'png';
          
          // Upload to S3
          console.log(`      📤 Uploading to S3...`);
          const filename = generateImageFilename(keyword, extension);
          const s3Url = await uploadImageToS3(base64Data, filename, mimeType);
          
          if (s3Url) {
            return s3Url;
          }
        }
      }
    }
    
    return null;
  } catch (error: any) {
    console.error(`      ⚠️  Image generation failed:`, error?.message || error);
    return null;
  }
}

async function cleanupBase64Images() {
  const seoPagesRepo = new SEOPagesRepository();
  const pool = getDatabasePool();
  
  try {
    console.log('🔍 Finding SEO pages to process...');
    
    // Get all SEO pages
    const pages = await seoPagesRepo.findAll();
    
    let updated = 0;
    let skipped = 0;
    const base64Pattern = /^data:image\//;
    const placeholderPattern = /picsum\.photos/;
    
    for (const page of pages) {
      if (!page.featuredImageUrl) {
        continue;
      }
      
      const isBase64 = base64Pattern.test(page.featuredImageUrl);
      const isPlaceholder = placeholderPattern.test(page.featuredImageUrl);
      
      if (isBase64 || isPlaceholder) {
        console.log(`\n   📄 Processing page: ${page.slug}`);
        console.log(`      Keyword: ${page.keyword}`);
        console.log(`      Current image: ${isBase64 ? 'Base64' : isPlaceholder ? 'Placeholder' : 'Other'}`);
        
        try {
          let s3Url: string | null = null;
          
          if (isBase64) {
            // Extract and upload existing base64 image
            const match = page.featuredImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1];
              const base64Data = match[2];
              const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;
              
              console.log(`      📤 Uploading existing base64 image to S3...`);
              const filename = generateImageFilename(page.keyword, extension);
              s3Url = await uploadImageToS3(base64Data, filename, `image/${mimeType}`);
            }
          } else if (isPlaceholder) {
            // Regenerate image using Gemini and upload to S3
            s3Url = await generateAndUploadImage(page.keyword);
          }
          
          if (s3Url) {
            // Update the page with S3 URL
            await pool.query(
              'UPDATE toolbox_seo_pages SET featured_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE slug = $2',
              [s3Url, page.slug]
            );
            
            console.log(`      ✅ Updated ${page.slug} with S3 URL: ${s3Url}`);
            updated++;
          } else {
            console.log(`      ⚠️  S3 upload/generation failed, keeping current image`);
            skipped++;
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
    console.error('❌ Error cleaning up images:', error);
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
