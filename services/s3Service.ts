// S3 Service for uploading images
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Support both AWS_ and S3_ prefixes for environment variables
const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || '';
const BUCKET_REGION = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-2';
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

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
  // Read env vars dynamically (not at module load time) to support dotenv loading
  // Support both S3_ and AWS_ prefixes
  const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME || '';
  const bucketRegion = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-2';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!bucketName) {
    console.warn('S3_BUCKET_NAME or AWS_S3_BUCKET_NAME not configured, skipping S3 upload');
    return null;
  }

  if (!accessKeyId || !secretAccessKey) {
    console.warn('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (or AWS_ equivalents) not configured, skipping S3 upload');
    return null;
  }

  try {
    // Create S3 client with current env vars
    const client = new S3Client({
      region: bucketRegion,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Convert base64 to buffer (handle both data URI and plain base64)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] // Extract base64 from data URI
      : base64Image; // Already plain base64
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate S3 key (path)
    const key = `10ex-ai-toolbox/${filename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // Make image publicly accessible
    });

    await client.send(command);

    // Return public URL
    const url = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
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
