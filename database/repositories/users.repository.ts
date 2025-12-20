// Users repository - database operations for users
// Loosely coupled from main app logic

import { getDatabasePool } from '../connection';
import { DatabaseUser } from '../schema';
import { User } from '../../types';

export class UsersRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT * FROM toolbox_users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const dbUser = result.rows[0];
    const interactions = await this.getUserInteractions(id);
    
    return this.mapToUser(dbUser, interactions);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT * FROM toolbox_users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const dbUser = result.rows[0];
    const interactions = await this.getUserInteractions(dbUser.id);
    
    return this.mapToUser(dbUser, interactions);
  }

  /**
   * Create a new user
   */
  async create(userData: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
  }): Promise<User> {
    const pool = getDatabasePool();
    
    const query = `
      INSERT INTO toolbox_users (id, name, email, referral_code, points)
      VALUES ($1, $2, $3, $4, 100)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userData.id,
      userData.name,
      userData.email,
      userData.referralCode,
    ]);

    const dbUser = result.rows[0];
    return this.mapToUser(dbUser, { likedToolIds: [], starredToolIds: [], bookmarkedToolIds: [] });
  }

  /**
   * Update user points
   */
  async updatePoints(userId: string, points: number): Promise<void> {
    const pool = getDatabasePool();
    await pool.query('UPDATE toolbox_users SET points = $1 WHERE id = $2', [points, userId]);
  }

  /**
   * Get user tool interactions
   */
  private async getUserInteractions(userId: string): Promise<{
    likedToolIds: string[];
    starredToolIds: string[];
    bookmarkedToolIds: string[];
  }> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT tool_id, interaction_type FROM toolbox_user_tool_interactions WHERE user_id = $1',
      [userId]
    );

    const likedToolIds: string[] = [];
    const starredToolIds: string[] = [];
    const bookmarkedToolIds: string[] = [];

    result.rows.forEach((row) => {
      if (row.interaction_type === 'like') {
        likedToolIds.push(row.tool_id);
      } else if (row.interaction_type === 'star') {
        starredToolIds.push(row.tool_id);
      } else if (row.interaction_type === 'bookmark') {
        bookmarkedToolIds.push(row.tool_id);
      }
    });

    return { likedToolIds, starredToolIds, bookmarkedToolIds };
  }

  /**
   * Add user tool interaction
   */
  async addInteraction(
    userId: string,
    toolId: string,
    interactionType: 'like' | 'star' | 'bookmark' | 'vote'
  ): Promise<void> {
    const pool = getDatabasePool();
    const id = `${userId}-${toolId}-${interactionType}`;
    
    await pool.query(
      `INSERT INTO toolbox_user_tool_interactions (id, user_id, tool_id, interaction_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, tool_id, interaction_type) DO NOTHING`,
      [id, userId, toolId, interactionType]
    );
  }

  /**
   * Remove user tool interaction
   */
  async removeInteraction(
    userId: string,
    toolId: string,
    interactionType: 'like' | 'star' | 'bookmark'
  ): Promise<void> {
    const pool = getDatabasePool();
    await pool.query(
      'DELETE FROM toolbox_user_tool_interactions WHERE user_id = $1 AND tool_id = $2 AND interaction_type = $3',
      [userId, toolId, interactionType]
    );
  }

  /**
   * Map database row to User entity
   */
  private mapToUser(
    dbUser: DatabaseUser,
    interactions: {
      likedToolIds: string[];
      starredToolIds: string[];
      bookmarkedToolIds: string[];
    }
  ): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      points: dbUser.points,
      referralCode: dbUser.referral_code,
      joinedAt: dbUser.joined_at.toISOString(),
      bookmarkedToolIds: interactions.bookmarkedToolIds,
      likedToolIds: interactions.likedToolIds,
      starredToolIds: interactions.starredToolIds,
    };
  }
}

