-- Add SEO pages table for dynamically generated pages
CREATE TABLE IF NOT EXISTS toolbox_seo_pages (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  keyword VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  meta_description TEXT,
  featured_image_url TEXT, -- Featured image URL for the page
  content TEXT NOT NULL, -- Full page content (HTML or markdown)
  introduction TEXT, -- Introduction paragraph
  sections JSONB DEFAULT '[]', -- Array of content sections
  target_keywords TEXT[], -- Array of target keywords
  search_volume INTEGER DEFAULT 0,
  competition_score INTEGER DEFAULT 0, -- 0-100
  related_tools JSONB DEFAULT '[]', -- Array of tool IDs
  structured_data JSONB, -- JSON-LD structured data
  canonical_url TEXT, -- Canonical URL for this page
  seo_score INTEGER DEFAULT 0, -- SEO quality score (0-100)
  validation_issues JSONB DEFAULT '[]', -- Array of validation issues
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_generated_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_slug ON toolbox_seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_keyword ON toolbox_seo_pages(keyword);
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_published ON toolbox_seo_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_updated ON toolbox_seo_pages(updated_at DESC);
