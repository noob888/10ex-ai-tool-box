-- Migration: Add topic clustering fields to toolbox_seo_pages table
-- Run this to add fields for topic clustering (pillar/cluster structure)

-- Add topic clustering fields
ALTER TABLE toolbox_seo_pages
ADD COLUMN IF NOT EXISTS topic_cluster VARCHAR(255),
ADD COLUMN IF NOT EXISTS pillar_topic_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cluster_rank INTEGER,
ADD COLUMN IF NOT EXISTS is_pillar BOOLEAN DEFAULT false;

-- Add indexes for topic cluster queries
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_topic_cluster ON toolbox_seo_pages(topic_cluster) WHERE topic_cluster IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_pillar_topic_id ON toolbox_seo_pages(pillar_topic_id) WHERE pillar_topic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_is_pillar ON toolbox_seo_pages(is_pillar) WHERE is_pillar = true;
CREATE INDEX IF NOT EXISTS idx_toolbox_seo_pages_cluster_rank ON toolbox_seo_pages(cluster_rank) WHERE cluster_rank IS NOT NULL;

-- Add comments
COMMENT ON COLUMN toolbox_seo_pages.topic_cluster IS 'Topic cluster identifier (e.g., "free-ai-tools", "ai-writing-tools")';
COMMENT ON COLUMN toolbox_seo_pages.pillar_topic_id IS 'Reference to pillar page slug (for cluster pages)';
COMMENT ON COLUMN toolbox_seo_pages.cluster_rank IS 'Order within cluster (1, 2, 3, etc.)';
COMMENT ON COLUMN toolbox_seo_pages.is_pillar IS 'Whether this is a pillar page (true) or cluster page (false)';
