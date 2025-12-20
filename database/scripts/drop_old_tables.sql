-- Drop old tables if they exist (run this before re-running migrations)
-- This script removes the old unprefixed tables

DROP TABLE IF EXISTS user_stacks CASCADE;
DROP TABLE IF EXISTS user_tool_interactions CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;
DROP TABLE IF EXISTS tools CASCADE;
DROP TABLE IF EXISTS users CASCADE;

