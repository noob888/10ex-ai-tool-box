import { getDatabasePool } from '../connection';

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

