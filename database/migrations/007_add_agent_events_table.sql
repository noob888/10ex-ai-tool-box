-- Migration 007: Agent events table for micro agents analytics

CREATE TABLE IF NOT EXISTS toolbox_agent_events (
  id VARCHAR(255) PRIMARY KEY,
  agent_id VARCHAR(120) NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  user_id VARCHAR(255) REFERENCES toolbox_users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_toolbox_agent_events_agent_id ON toolbox_agent_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_toolbox_agent_events_event_type ON toolbox_agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_toolbox_agent_events_created_at ON toolbox_agent_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_toolbox_agent_events_user_id ON toolbox_agent_events(user_id);

