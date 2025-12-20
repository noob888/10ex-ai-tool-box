-- Initial database schema migration with toolbox_ prefix to avoid conflicts
-- Run this to set up the database tables

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

