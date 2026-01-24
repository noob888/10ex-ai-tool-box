// Test script to verify Gemini 3 Pro Image (Nano Banana Pro) generation
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testImageGeneration() {
  console.log('\n🎨 Testing Gemini 3 Pro Image (Nano Banana Pro) Generation...');
  console.log('='.repeat(60));
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set');
    return;
  }
  
  console.log('✅ GEMINI_API_KEY configured');
  
  // Test keyword
  const testKeyword = 'AI Marketing Automation Tools';
  const imagePrompt = `Create a professional, modern featured image for an SEO article about "${testKeyword}". 
    
Requirements:
- Clean, minimalist design with modern aesthetics
- Professional color scheme (blues, purples, or tech-inspired colors)
- 1200x630 pixels aspect ratio (landscape)
- Abstract or conceptual representation of AI tools and technology
- No text overlays, just visual elements
- High quality, suitable for website header/featured image
- Professional and trustworthy appearance

Style: Modern tech, minimalist, clean, professional`;

  console.log(`\n📝 Test Keyword: "${testKeyword}"`);
  console.log(`📝 Prompt: ${imagePrompt.substring(0, 100)}...`);
  console.log(`\n🚀 Calling Gemini 3 Pro Image API...`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
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

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Response received in ${duration}s`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API call successful!');
      
      // Check response structure
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const imagePart = parts.find((p: any) => p.inlineData);
        
        if (imagePart?.inlineData?.data) {
          const base64Data = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || 'image/png';
          const imageSize = (base64Data.length * 3) / 4; // Approximate size in bytes
          const imageSizeKB = (imageSize / 1024).toFixed(2);
          
          console.log(`\n📸 Image Generated Successfully!`);
          console.log(`   MIME Type: ${mimeType}`);
          console.log(`   Size: ~${imageSizeKB} KB`);
          console.log(`   Base64 Length: ${base64Data.length} characters`);
          
          // Check if S3 is configured
          const { uploadImageToS3, generateImageFilename } = await import('./services/s3Service');
          const bucketName = process.env.S3_STORAGE_BUCKET_NAME || process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
          
          if (bucketName) {
            console.log(`\n📤 Testing S3 upload...`);
            try {
              const filename = generateImageFilename(testKeyword, mimeType.split('/')[1] || 'png');
              const s3Url = await uploadImageToS3(base64Data, filename, mimeType);
              
              if (s3Url) {
                console.log(`✅ Image uploaded to S3 successfully!`);
                console.log(`   URL: ${s3Url}`);
                console.log(`\n🎉 Test completed successfully!`);
                console.log(`   - Gemini 3 Pro Image API: ✅ Working`);
                console.log(`   - Image Generation: ✅ Working`);
                console.log(`   - S3 Upload: ✅ Working`);
              } else {
                console.log(`⚠️  S3 upload returned null (check S3 credentials)`);
              }
            } catch (s3Error: any) {
              console.error(`❌ S3 upload failed:`, s3Error?.message || s3Error);
            }
          } else {
            console.log(`\n⚠️  S3 not configured (skipping upload test)`);
            console.log(`   Set S3_STORAGE_BUCKET_NAME to test S3 upload`);
            console.log(`\n🎉 Image generation test completed!`);
            console.log(`   - Gemini 3 Pro Image API: ✅ Working`);
            console.log(`   - Image Generation: ✅ Working`);
          }
        } else {
          console.log(`\n⚠️  Response structure:`);
          console.log(JSON.stringify(data, null, 2).substring(0, 500));
          console.log(`\n❌ No image data found in response`);
        }
      } else {
        console.log(`\n⚠️  Unexpected response structure:`);
        console.log(JSON.stringify(data, null, 2).substring(0, 500));
        console.log(`\n❌ Response doesn't match expected format`);
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`\n❌ API call failed!`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Error:`, errorData.error || errorData);
      
      if (response.status === 404) {
        console.error(`\n💡 Model might not be available yet. Try:`);
        console.error(`   - Check if gemini-3-pro-image-preview is available in your region`);
        console.error(`   - Verify your API key has access to preview models`);
        console.error(`   - Try using gemini-2.5-flash-image as fallback`);
      } else if (response.status === 403) {
        console.error(`\n💡 Access denied. Check:`);
        console.error(`   - API key is valid`);
        console.error(`   - API key has permissions for image generation`);
        console.error(`   - Preview models are enabled for your account`);
      } else if (response.status === 429) {
        console.error(`\n💡 Rate limit exceeded. Wait a bit and try again.`);
      }
    }
  } catch (error: any) {
    console.error(`\n❌ Test failed with error:`);
    console.error(`   ${error?.message || error}`);
    if (error?.stack) {
      console.error(`\nStack trace:`);
      console.error(error.stack);
    }
  }
}

// Run the test
testImageGeneration()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
