# SEO Agent Setup Guide

## Overview

The SEO Agent uses **Claude Agent SDK** (Anthropic) to automatically:
1. Research high-value SEO keyword opportunities
2. Generate full, SEO-optimized page content
3. Create new pages on your site
4. Update sitemap automatically

## Features

✅ **AI-Powered SEO Research** - Claude identifies high-value keywords  
✅ **Full Page Generation** - Creates complete, SEO-optimized content  
✅ **Automatic Publishing** - Pages are saved and published automatically  
✅ **Sitemap Integration** - Dynamically generated pages appear in sitemap  
✅ **Cron-Triggered** - Runs automatically on schedule  

## Setup

### 1. Install Dependencies

Already installed:
- `@anthropic-ai/sdk` - Claude Agent SDK

### 2. Environment Variables

Add to `.env.local` or Amplify environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key_here  # Already configured for news agent
CRON_SECRET=your_cron_secret_here  # Optional but recommended
UNSPLASH_ACCESS_KEY=your_unsplash_key  # Optional - for better featured images
```

**Note:** Uses the same `GEMINI_API_KEY` as the news agent - no additional API key needed!

**Optional:** Add `UNSPLASH_ACCESS_KEY` for high-quality featured images. Get it from: https://unsplash.com/developers
Without it, the agent will use placeholder images (still works fine).

### 3. Run Database Migration

Create the SEO pages table:

```bash
npm run db:migrate
```

This will create the `toolbox_seo_pages` table.

### 4. Set Up Cron Job

#### Option A: n8n (Recommended)

1. Create a new workflow in n8n
2. Add **Schedule Trigger**:
   - Cron: `0 2 * * *` (daily at 2 AM UTC)
3. Add **HTTP Request** node:
   - Method: `GET`
   - URL: `https://tools.10ex.ai/api/seo/generate`
   - Headers (if CRON_SECRET is set):
     - `Authorization`: `Bearer YOUR_CRON_SECRET`
4. Save and activate

#### Option B: AWS EventBridge

1. Go to AWS EventBridge Scheduler
2. Create schedule:
   - Name: `seo-page-generator`
   - Schedule: `0 2 * * ? *` (daily at 2 AM UTC)
   - Target: Lambda function or HTTP endpoint
   - URL: `https://tools.10ex.ai/api/seo/generate`

#### Option C: External Cron Service

Use cron-job.org or similar:
- URL: `https://tools.10ex.ai/api/seo/generate`
- Schedule: Daily at 2 AM UTC

## How It Works

### 1. SEO Research Phase

Claude analyzes:
- Search volume potential
- Competition level
- Commercial intent
- Relevance to AI tools

Returns 3-5 keyword opportunities per run.

### 2. Content Generation Phase

For each keyword:
- Finds related tools from database
- Generates full page content (1500-2000 words)
- Creates structured sections:
  - Introduction
  - Main content sections
  - Conclusion
- Generates JSON-LD structured data

### 3. Publishing Phase

- Saves page to database
- Marks as published
- Page becomes accessible at `/seo/[slug]`
- Automatically included in sitemap

## API Endpoints

### GET `/api/seo/generate`

Triggers SEO page generation (cron endpoint).

**Response:**
```json
{
  "success": true,
  "message": "SEO page generation started in background",
  "jobId": "seo-1234567890-abc123",
  "timestamp": "2026-01-18T10:00:00.000Z"
}
```

**Status:** 202 Accepted (runs in background)

## Manual Testing

Test the agent manually:

```bash
curl https://tools.10ex.ai/api/seo/generate
```

Or locally:
```bash
curl http://localhost:3000/api/seo/generate
```

## Monitoring

### Check CloudWatch Logs

Look for:
- `[SEO-GEN]` prefix in logs
- Job completion messages
- Error logs

### Check Generated Pages

1. View in database:
   ```sql
   SELECT slug, keyword, title, is_published, created_at 
   FROM toolbox_seo_pages 
   ORDER BY created_at DESC;
   ```

2. Visit pages:
   - `https://tools.10ex.ai/seo/[slug]`

3. Check sitemap:
   - `https://tools.10ex.ai/sitemap.xml`

## Page Structure

Generated pages include:
- **Title**: SEO-optimized title
- **Meta Description**: Compelling description
- **Introduction**: 2-3 paragraph introduction
- **Sections**: 3-5 content sections with headings
- **Conclusion**: 1-2 paragraph conclusion
- **Related Tools**: Automatically matched tools
- **Structured Data**: JSON-LD for rich snippets

## Customization

### Adjust Research Criteria

Edit `services/seoAgent.ts`:
- Change search volume threshold
- Modify competition score requirements
- Add custom keyword filters

### Customize Content Generation

Edit the prompt in `generatePageContent()`:
- Change content length
- Add specific sections
- Modify tone/style

### Control Publishing

Pages are automatically published. To review before publishing:
1. Set `isPublished: false` in repository
2. Create admin interface to review/approve
3. Manually publish via API

## Troubleshooting

### No Pages Generated

1. Check `ANTHROPIC_API_KEY` is set
2. Verify database migration ran
3. Check CloudWatch logs for errors
4. Ensure tools exist in database

### Pages Not Appearing

1. Check `is_published = true` in database
2. Verify slug is valid (lowercase, hyphens only)
3. Check page route handles dynamic pages
4. Clear Next.js cache

### Rate Limiting

Claude API has rate limits. The agent:
- Adds 2-second delays between pages
- Handles rate limit errors gracefully
- Logs rate limit issues

## Cost Considerations

**Anthropic API Pricing:**
- Claude 3.5 Sonnet: ~$3 per 1M input tokens, $15 per 1M output tokens
- Each page generation: ~$0.05-0.15 (depending on content length)
- Daily run (3-5 pages): ~$0.15-0.75/day
- Monthly: ~$5-25/month

## Next Steps

1. ✅ Set `ANTHROPIC_API_KEY`
2. ✅ Run migration
3. ✅ Test manually
4. ✅ Set up cron job
5. ✅ Monitor first few runs
6. ✅ Review generated pages
7. ✅ Adjust prompts if needed

The agent will automatically discover new SEO opportunities and create pages daily!
