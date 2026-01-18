// S3 Service for uploading images
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const BUCKET_REGION = process.env.AWS_REGION || 'us-east-2';

/**
 * Upload base64 image to S3 and return public URL
 * @param base64Image - Base64 string (without data URI prefix) or full data URI
 * @param filename - S3 filename
 * @param contentType - MIME type (e.g., 'image/png')
 */
export async function uploadImageToS3(
  base64Image: string,
  filename: string,
  contentType: string = 'image/png'
): Promise<string | null> {
  if (!BUCKET_NAME) {
    console.warn('AWS_S3_BUCKET_NAME not configured, skipping S3 upload');
    return null;
  }

  try {
    // Convert base64 to buffer (handle both data URI and plain base64)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] // Extract base64 from data URI
      : base64Image; // Already plain base64
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate S3 key (path)
    const key = `10ex-ai-toolbox/${filename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Make image publicly accessible
    });

    await s3Client.send(command);

    // Return public URL
    const url = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
    console.log(`   ✅ Image uploaded to S3: ${url}`);
    return url;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    return null;
  }
}

/**
 * Generate filename from keyword
 */
export function generateImageFilename(keyword: string, extension: string = 'png'): string {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  const timestamp = Date.now();
  return `${slug}-${timestamp}.${extension}`;
}
