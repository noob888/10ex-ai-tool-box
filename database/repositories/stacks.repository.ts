// Stacks repository - database operations for user stacks
// Loosely coupled from main app logic

import { getDatabasePool } from '../connection';
import { DatabaseStack } from '../schema';
import { Tool } from '../../types';

export class StacksRepository {
  /**
   * Get all stacks for a user
   */
  async findByUserId(userId: string): Promise<DatabaseStack[]> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT * FROM toolbox_user_stacks WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Get stack by ID
   */
  async findById(id: string): Promise<DatabaseStack | null> {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT * FROM toolbox_user_stacks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Create a new stack
   */
  async create(userId: string, toolIds: string[], name?: string): Promise<DatabaseStack> {
    const pool = getDatabasePool();
    const id = `stack-${userId}-${Date.now()}`;
    
    const query = `
      INSERT INTO toolbox_user_stacks (id, user_id, name, tool_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      userId,
      name || 'My Stack',
      JSON.stringify(toolIds),
    ]);

    return result.rows[0];
  }

  /**
   * Update stack
   */
  async update(id: string, toolIds: string[], name?: string): Promise<DatabaseStack> {
    const pool = getDatabasePool();
    
    const query = `
      UPDATE toolbox_user_stacks
      SET tool_ids = $1, name = COALESCE($2, name), updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [JSON.stringify(toolIds), name, id]);
    return result.rows[0];
  }

  /**
   * Delete stack
   */
  async delete(id: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query('DELETE FROM toolbox_user_stacks WHERE id = $1', [id]);
  }
}

