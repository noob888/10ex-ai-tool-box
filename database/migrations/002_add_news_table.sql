-- Add news articles table for AI news aggregation
CREATE TABLE IF NOT EXISTS toolbox_news (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  source VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  image_url TEXT,
  published_at TIMESTAMP NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(100) DEFAULT 'AI',
  tags TEXT[], -- Array of tags
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toolbox_news_published_at ON toolbox_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_toolbox_news_source ON toolbox_news(source);
CREATE INDEX IF NOT EXISTS idx_toolbox_news_category ON toolbox_news(category);
CREATE INDEX IF NOT EXISTS idx_toolbox_news_featured ON toolbox_news(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_toolbox_news_url ON toolbox_news(url);

