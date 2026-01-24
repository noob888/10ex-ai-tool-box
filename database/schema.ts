// Database schema definitions - loosely coupled from main app
// This layer handles all database structure and migrations

export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  points: number;
  referral_code: string;
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseTool {
  id: string;
  name: string;
  tagline: string;
  category: string;
  sub_category: string;
  description: string;
  strengths: string[]; // JSON array
  weaknesses: string[]; // JSON array
  pricing: string;
  rating: number;
  popularity: number;
  votes: number;
  alternatives: string[]; // JSON array
  best_for: string;
  overkill_for: string;
  is_verified: boolean;
  launch_date: Date;
  website_url: string;
  created_at: Date;
  updated_at: Date;
  // Discovery fields (added in migration 004)
  discovered_at?: Date | null;
  discovery_source?: string | null;
  last_verified_at?: Date | null;
  verification_status?: string | null;
  growth_rate_6mo?: number | null;
  is_rapidly_growing?: boolean | null;
  monthly_visits?: number | null;
  // Enrichment fields (added in migration 006)
  faqs?: any[]; // JSONB array of FAQ items
  use_cases?: any[]; // JSONB array of use cases
  faqs_generated_at?: Date | null;
  use_cases_generated_at?: Date | null;
}

export interface DatabasePromptTemplate {
  id: string;
  title: string;
  category: string;
  use_case: string;
  prompt: string;
  level: string;
  copy_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseUserToolInteraction {
  id: string;
  user_id: string;
  tool_id: string;
  interaction_type: 'like' | 'star' | 'bookmark' | 'vote';
  created_at: Date;
}

export interface DatabaseStack {
  id: string;
  user_id: string;
  name: string;
  tool_ids: string[]; // JSON array
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseNews {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  author: string | null;
  image_url: string | null;
  published_at: Date;
  fetched_at: Date;
  category: string;
  tags: string[];
  view_count: number;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

// SQL schema creation queries
export const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS toolbox_users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  referral_code VARCHAR(50) UNIQUE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tools table
CREATE TABLE IF NOT EXISTS toolbox_tools (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  description TEXT,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  pricing VARCHAR(50),
  rating INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  alternatives JSONB DEFAULT '[]',
  best_for TEXT,
  overkill_for TEXT,
  is_verified BOOLEAN DEFAULT false,
  launch_date DATE,
  website_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompt templates table
CREATE TABLE IF NOT EXISTS toolbox_prompt_templates (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  use_case VARCHAR(255),
  prompt TEXT NOT NULL,
  level VARCHAR(50),
  copy_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User tool interactions (likes, stars, bookmarks, votes)
CREATE TABLE IF NOT EXISTS toolbox_user_tool_interactions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES toolbox_users(id) ON DELETE CASCADE,
  tool_id VARCHAR(255) REFERENCES toolbox_tools(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tool_id, interaction_type)
);

-- User stacks
CREATE TABLE IF NOT EXISTS toolbox_user_stacks (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES toolbox_users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  tool_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_category ON toolbox_tools(category);
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_rating ON toolbox_tools(rating DESC);
CREATE INDEX IF NOT EXISTS idx_toolbox_tools_popularity ON toolbox_tools(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_toolbox_user_interactions_user_id ON toolbox_user_tool_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_user_interactions_tool_id ON toolbox_user_tool_interactions(tool_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_user_stacks_user_id ON toolbox_user_stacks(user_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_prompts_category ON toolbox_prompt_templates(category);
`;

