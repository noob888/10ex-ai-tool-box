# AI News System Setup Guide

## Overview

The AI News system automatically fetches and displays the latest AI news from multiple RSS feeds daily. News articles are displayed on the homepage and leaderboard pages.

## Features

- ✅ Automatic daily news fetching from 6+ RSS feeds
- ✅ Featured news articles with images
- ✅ News displayed on homepage and leaderboard
- ✅ Database storage with deduplication
- ✅ Automatic tagging and categorization
- ✅ View tracking

## Setup Instructions

### 1. Run Database Migration

First, create the news table in your database:

```bash
# Run the migration
psql $DATABASE_URL -f database/migrations/002_add_news_table.sql

# Or use the migrate script
npm run db:migrate
```

### 2. Install Dependencies

The system requires `date-fns` for date formatting:

```bash
npm install date-fns
```

### 3. Set Up Cron Job

**📖 For detailed cron setup instructions, see [CRON_SETUP.md](./CRON_SETUP.md)**

#### Quick Setup

**For AWS Amplify (EventBridge):**
1. Go to [AWS EventBridge Console](https://console.aws.amazon.com/events/)
2. Create a rule with schedule: `0 6 * * ? *` (daily at 6 AM UTC)
3. Set target to: `https://tools.10ex.ai/api/news/cron`
4. Add `CRON_SECRET` environment variable in Amplify

**For Vercel:**
- Already configured in `vercel.json`
- Just add `CRON_SECRET` environment variable

**Manual Test:**
```bash
curl https://tools.10ex.ai/api/news/cron
```

### 4. Configure RSS Feeds

Edit `services/newsService.ts` to add or modify RSS feeds:

```typescript
const RSS_FEEDS: RSSFeed[] = [
  {
    url: 'https://example.com/feed.xml',
    source: 'Source Name',
    category: 'AI',
  },
  // Add more feeds...
];
```

## API Endpoints

### GET `/api/news`
Fetch news articles with optional filters:

```
GET /api/news?limit=10&featured=true&category=AI&source=TechCrunch
```

Query Parameters:
- `limit` (number): Max articles to return (default: 10, max: 50)
- `featured` (boolean): Filter featured articles
- `category` (string): Filter by category
- `source` (string): Filter by source

### GET `/api/news/cron`
Cron endpoint to fetch and save news. Requires authentication:

```
GET /api/news/cron
Authorization: Bearer {CRON_SECRET}
```

### GET `/api/news/fetch-rss`
Proxy endpoint to fetch RSS feeds (avoids CORS):

```
GET /api/news/fetch-rss?url={encoded-rss-url}
```

## Database Schema

The `toolbox_news` table stores:

- `id`: Unique identifier
- `title`: Article title
- `description`: Article description/snippet
- `url`: Article URL (unique)
- `source`: News source name
- `author`: Author name (optional)
- `image_url`: Featured image URL (optional)
- `published_at`: Publication date
- `fetched_at`: When article was fetched
- `category`: Category (default: 'AI')
- `tags`: Array of tags
- `view_count`: Number of views
- `is_featured`: Whether article is featured
- `created_at`, `updated_at`: Timestamps

## How It Works

1. **Daily Fetch**: Cron job calls `/api/news/cron` daily
2. **RSS Parsing**: Service fetches RSS feeds from configured sources
3. **Deduplication**: Articles are deduplicated by URL
4. **Storage**: New articles are saved to database
5. **Featured Selection**: Top 3 articles with images are marked as featured
6. **Display**: News is displayed on homepage and leaderboard

## Customization

### Change Featured Criteria

Edit `services/newsService.ts`:

```typescript
// Mark top 3 as featured
for (let i = 0; i < Math.min(3, articlesWithImages.length); i++) {
  await newsRepo.setFeatured(articlesWithImages[i].id, true);
}
```

### Change News Display

Edit `components/App.tsx` to modify:
- Number of articles shown
- Layout and styling
- Which pages show news

### Add More RSS Feeds

Add to `RSS_FEEDS` array in `services/newsService.ts`:

```typescript
{
  url: 'https://new-source.com/feed.xml',
  source: 'New Source',
  category: 'AI',
}
```

## Troubleshooting

### News Not Appearing

1. Check if cron job is running:
   ```bash
   curl https://your-domain.com/api/news/cron \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

2. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM toolbox_news;"
   ```

3. Check RSS feeds are accessible:
   ```bash
   curl "https://your-domain.com/api/news/fetch-rss?url=https://techcrunch.com/tag/artificial-intelligence/feed/"
   ```

### Cron Job Not Running

- Verify `CRON_SECRET` is set correctly
- Check cron service logs (Vercel/EventBridge)
- Ensure endpoint is publicly accessible
- Verify database connection is working

### Articles Not Being Saved

- Check database migration ran successfully
- Verify RSS feeds return valid XML
- Check server logs for errors
- Ensure articles are less than 7 days old (configurable)

## Maintenance

### Clean Old Articles

Articles older than 30 days are automatically cleaned up. To change this:

```typescript
// In newsService.ts or create a cleanup endpoint
await newsRepo.deleteOldArticles(30); // days
```

### Manual News Fetch

For testing or manual updates:

```bash
# Via API
curl -X GET "https://your-domain.com/api/news/cron" \
  -H "Authorization: Bearer your-secret"

# Or create a script
node scripts/fetch-news.js
```

## Next Steps

1. ✅ Run database migration
2. ✅ Set up cron job
3. ✅ Configure `CRON_SECRET`
4. ✅ Test manual fetch
5. ✅ Verify news appears on homepage
6. ✅ Monitor cron job execution

The system will automatically start fetching news daily once the cron job is configured!

