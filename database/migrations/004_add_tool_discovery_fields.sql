-- Migration: Add tool discovery fields to toolbox_tools table
-- Run this to add fields for tracking tool discovery, growth metrics, and verification

-- Add discovery and growth tracking fields
ALTER TABLE toolbox_tools
ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS discovery_source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS growth_rate_6mo DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS is_rapidly_growing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS monthly_visits BIGINT;

-- Add indexes for discovery queries
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_discovery_source ON toolbox_tools(discovery_source);
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_is_rapidly_growing ON toolbox_tools(is_rapidly_growing) WHERE is_rapidly_growing = true;
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_growth_rate ON toolbox_tools(growth_rate_6mo DESC) WHERE growth_rate_6mo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_discovered_at ON toolbox_tools(discovered_at DESC) WHERE discovered_at IS NOT NULL;

-- Add comment to table
COMMENT ON COLUMN toolbox_tools.discovered_at IS 'Timestamp when tool was first discovered by AI agent';
COMMENT ON COLUMN toolbox_tools.discovery_source IS 'Source of discovery: ai_search, product_hunt, manual';
COMMENT ON COLUMN toolbox_tools.last_verified_at IS 'Last time tool website was verified as accessible';
COMMENT ON COLUMN toolbox_tools.verification_status IS 'Verification status: pending, verified, failed';
COMMENT ON COLUMN toolbox_tools.growth_rate_6mo IS '6-month growth percentage (e.g., 88 for 88% growth)';
COMMENT ON COLUMN toolbox_tools.is_rapidly_growing IS 'Flag for tools with >50% growth in 6 months';
COMMENT ON COLUMN toolbox_tools.monthly_visits IS 'Estimated monthly visits (e.g., 911000000 for 911M)';
