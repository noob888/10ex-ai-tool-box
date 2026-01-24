-- Add FAQs and use cases columns to tools table
-- These will be stored as JSONB arrays and generated once, then cached

ALTER TABLE toolbox_tools 
ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS use_cases JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS faqs_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS use_cases_generated_at TIMESTAMP;

-- Index for querying tools with generated content
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_faqs_generated ON toolbox_tools(faqs_generated_at) WHERE faqs_generated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_usecases_generated ON toolbox_tools(use_cases_generated_at) WHERE use_cases_generated_at IS NOT NULL;
