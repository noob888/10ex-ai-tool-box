import { getDatabasePool } from '../connection';

let ensured = false;

async function ensureAgentEventsTable(): Promise<void> {
  if (ensured) return;
  const pool = getDatabasePool();

  // Fail open: if this fails (permissions, etc.), inserts will still try and can be caught upstream.
  await pool.query(`
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
  `);

  ensured = true;
}

export class AgentEventsRepository {
  async insert(event: {
    id: string;
    agentId: string;
    eventType: string;
    userId?: string | null;
    sessionId?: string | null;
    payload?: any;
  }): Promise<void> {
    const pool = getDatabasePool();

    await ensureAgentEventsTable();

    await pool.query(
      `INSERT INTO toolbox_agent_events (id, agent_id, event_type, user_id, session_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        event.id,
        event.agentId,
        event.eventType,
        event.userId || null,
        event.sessionId || null,
        JSON.stringify(event.payload || {}),
      ]
    );
  }
}

