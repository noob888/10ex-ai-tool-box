// Tools repository - database operations for tools
// Loosely coupled from main app logic

import { getDatabasePool } from '../connection';
import { DatabaseTool } from '../schema';
import { Tool, Category } from '../../types';

export class ToolsRepository {
  /**
   * Get all tools with optional filters
   */
  async findAll(filters?: {
    category?: Category;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Tool[]> {
    const pool = getDatabasePool();
    let query = 'SELECT * FROM toolbox_tools WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (name ILIKE $${paramIndex} OR tagline ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY votes DESC, rating DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows.map(this.mapToTool);
  }

  /**
   * Get tool by ID
   */
  async findById(id: string): Promise<Tool | null> {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT * FROM toolbox_tools WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToTool(result.rows[0]);
  }

  /**
   * Get trending tools
   */
  async findTrending(limit: number = 8): Promise<Tool[]> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT * FROM toolbox_tools ORDER BY popularity DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(this.mapToTool);
  }

  /**
   * Get top rated tools by category
   */
  async findTopRatedByCategory(category: Category, limit: number = 5): Promise<Tool[]> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT * FROM toolbox_tools WHERE category = $1 ORDER BY rating DESC LIMIT $2',
      [category, limit]
    );
    return result.rows.map(this.mapToTool);
  }

  /**
   * Get tools by IDs (for SEO pages with related tools)
   */
  async findByIds(ids: string[]): Promise<Tool[]> {
    if (ids.length === 0) {
      return [];
    }
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT * FROM toolbox_tools WHERE id = ANY($1::text[]) ORDER BY rating DESC',
      [ids]
    );
    return result.rows.map(this.mapToTool);
  }

  /**
   * Create or update a tool
   */
  async upsert(tool: Partial<Tool>): Promise<Tool> {
    const pool = getDatabasePool();
    const dbTool = this.mapToDatabaseTool(tool);
    
    // Check if discovery fields exist (from migration 004)
    const hasDiscoveryFields = dbTool.discovered_at !== undefined || 
                               dbTool.discovery_source !== undefined ||
                               dbTool.growth_rate_6mo !== undefined ||
                               dbTool.is_rapidly_growing !== undefined ||
                               dbTool.monthly_visits !== undefined;

    const query = hasDiscoveryFields ? `
      INSERT INTO toolbox_tools (
        id, name, tagline, category, sub_category, description,
        strengths, weaknesses, pricing, rating, popularity, votes,
        alternatives, best_for, overkill_for, is_verified, launch_date, website_url,
        discovered_at, discovery_source, last_verified_at, verification_status,
        growth_rate_6mo, is_rapidly_growing, monthly_visits
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        category = EXCLUDED.category,
        sub_category = EXCLUDED.sub_category,
        description = EXCLUDED.description,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        pricing = EXCLUDED.pricing,
        rating = EXCLUDED.rating,
        popularity = EXCLUDED.popularity,
        votes = EXCLUDED.votes,
        alternatives = EXCLUDED.alternatives,
        best_for = EXCLUDED.best_for,
        overkill_for = EXCLUDED.overkill_for,
        is_verified = EXCLUDED.is_verified,
        website_url = EXCLUDED.website_url,
        discovered_at = COALESCE(EXCLUDED.discovered_at, toolbox_tools.discovered_at),
        discovery_source = COALESCE(EXCLUDED.discovery_source, toolbox_tools.discovery_source),
        last_verified_at = COALESCE(EXCLUDED.last_verified_at, toolbox_tools.last_verified_at),
        verification_status = COALESCE(EXCLUDED.verification_status, toolbox_tools.verification_status),
        growth_rate_6mo = COALESCE(EXCLUDED.growth_rate_6mo, toolbox_tools.growth_rate_6mo),
        is_rapidly_growing = COALESCE(EXCLUDED.is_rapidly_growing, toolbox_tools.is_rapidly_growing),
        monthly_visits = COALESCE(EXCLUDED.monthly_visits, toolbox_tools.monthly_visits),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    ` : `
      INSERT INTO toolbox_tools (
        id, name, tagline, category, sub_category, description,
        strengths, weaknesses, pricing, rating, popularity, votes,
        alternatives, best_for, overkill_for, is_verified, launch_date, website_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        category = EXCLUDED.category,
        sub_category = EXCLUDED.sub_category,
        description = EXCLUDED.description,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        pricing = EXCLUDED.pricing,
        rating = EXCLUDED.rating,
        popularity = EXCLUDED.popularity,
        votes = EXCLUDED.votes,
        alternatives = EXCLUDED.alternatives,
        best_for = EXCLUDED.best_for,
        overkill_for = EXCLUDED.overkill_for,
        is_verified = EXCLUDED.is_verified,
        website_url = EXCLUDED.website_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const params = hasDiscoveryFields ? [
      dbTool.id,
      dbTool.name,
      dbTool.tagline,
      dbTool.category,
      dbTool.sub_category,
      dbTool.description,
      JSON.stringify(dbTool.strengths),
      JSON.stringify(dbTool.weaknesses),
      dbTool.pricing,
      dbTool.rating,
      dbTool.popularity,
      dbTool.votes,
      JSON.stringify(dbTool.alternatives),
      dbTool.best_for,
      dbTool.overkill_for,
      dbTool.is_verified,
      dbTool.launch_date,
      dbTool.website_url,
      dbTool.discovered_at || null,
      dbTool.discovery_source || 'manual',
      dbTool.last_verified_at || null,
      dbTool.verification_status || 'pending',
      dbTool.growth_rate_6mo || null,
      dbTool.is_rapidly_growing || false,
      dbTool.monthly_visits || null,
    ] : [
      dbTool.id,
      dbTool.name,
      dbTool.tagline,
      dbTool.category,
      dbTool.sub_category,
      dbTool.description,
      JSON.stringify(dbTool.strengths),
      JSON.stringify(dbTool.weaknesses),
      dbTool.pricing,
      dbTool.rating,
      dbTool.popularity,
      dbTool.votes,
      JSON.stringify(dbTool.alternatives),
      dbTool.best_for,
      dbTool.overkill_for,
      dbTool.is_verified,
      dbTool.launch_date,
      dbTool.website_url,
    ];

    const result = await pool.query(query, params);

    return this.mapToTool(result.rows[0]);
  }

  /**
   * Increment tool votes
   */
  async incrementVotes(toolId: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query('UPDATE toolbox_tools SET votes = votes + 1 WHERE id = $1', [toolId]);
  }

  /**
   * Map database row to Tool entity
   */
  private mapToTool(row: DatabaseTool): Tool {
    return {
      id: row.id,
      name: row.name,
      tagline: row.tagline || '',
      category: row.category as Category,
      subCategory: row.sub_category || '',
      description: row.description || '',
      strengths: Array.isArray(row.strengths) ? row.strengths : [],
      weaknesses: Array.isArray(row.weaknesses) ? row.weaknesses : [],
      pricing: row.pricing as any,
      rating: row.rating,
      popularity: row.popularity,
      votes: row.votes,
      alternatives: Array.isArray(row.alternatives) ? row.alternatives : [],
      bestFor: row.best_for || '',
      overkillFor: row.overkill_for || '',
      prompts: [], // Will be loaded separately if needed
      isVerified: row.is_verified,
      launchDate: row.launch_date?.toISOString().split('T')[0] || '',
      websiteUrl: row.website_url || '',
    };
  }

  /**
   * Map Tool entity to database format
   */
  private mapToDatabaseTool(tool: Partial<Tool>): Partial<DatabaseTool> {
    const dbTool: Partial<DatabaseTool> = {
      id: tool.id,
      name: tool.name,
      tagline: tool.tagline,
      category: tool.category as string,
      sub_category: tool.subCategory,
      description: tool.description,
      strengths: tool.strengths || [],
      weaknesses: tool.weaknesses || [],
      pricing: tool.pricing as string,
      rating: tool.rating,
      popularity: tool.popularity,
      votes: tool.votes,
      alternatives: tool.alternatives || [],
      best_for: tool.bestFor,
      overkill_for: tool.overkillFor,
      is_verified: tool.isVerified,
      launch_date: tool.launchDate ? new Date(tool.launchDate) : undefined,
      website_url: tool.websiteUrl,
    };

    // Add discovery fields if they exist (from extended Tool type or direct assignment)
    if ((tool as any).discoveredAt !== undefined) {
      dbTool.discovered_at = (tool as any).discoveredAt ? new Date((tool as any).discoveredAt) : null;
    }
    if ((tool as any).discoverySource !== undefined) {
      dbTool.discovery_source = (tool as any).discoverySource || null;
    }
    if ((tool as any).lastVerifiedAt !== undefined) {
      dbTool.last_verified_at = (tool as any).lastVerifiedAt ? new Date((tool as any).lastVerifiedAt) : null;
    }
    if ((tool as any).verificationStatus !== undefined) {
      dbTool.verification_status = (tool as any).verificationStatus || null;
    }
    if ((tool as any).growthRate6mo !== undefined) {
      dbTool.growth_rate_6mo = (tool as any).growthRate6mo || null;
    }
    if ((tool as any).isRapidlyGrowing !== undefined) {
      dbTool.is_rapidly_growing = (tool as any).isRapidlyGrowing || false;
    }
    if ((tool as any).monthlyVisits !== undefined) {
      dbTool.monthly_visits = (tool as any).monthlyVisits || null;
    }

    return dbTool;
  }

  /**
   * Update FAQs for a tool
   */
  async updateFAQs(toolId: string, faqs: any[]): Promise<void> {
    const pool = getDatabasePool();
    await pool.query(
      'UPDATE toolbox_tools SET faqs = $1, faqs_generated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(faqs), toolId]
    );
  }

  /**
   * Update use cases for a tool
   */
  async updateUseCases(toolId: string, useCases: any[]): Promise<void> {
    const pool = getDatabasePool();
    await pool.query(
      'UPDATE toolbox_tools SET use_cases = $1, use_cases_generated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(useCases), toolId]
    );
  }

  /**
   * Get FAQs and use cases for a tool
   */
  async getEnrichment(toolId: string): Promise<{ faqs: any[]; useCases: any[] }> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT faqs, use_cases FROM toolbox_tools WHERE id = $1',
      [toolId]
    );
    
    if (result.rows.length === 0) {
      return { faqs: [], useCases: [] };
    }

    const row = result.rows[0];
    return {
      faqs: Array.isArray(row.faqs) ? row.faqs : [],
      useCases: Array.isArray(row.use_cases) ? row.use_cases : [],
    };
  }

  /**
   * Get all tools that need FAQs or use cases generated
   */
  async findToolsNeedingEnrichment(limit: number = 50): Promise<Tool[]> {
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT * FROM toolbox_tools 
       WHERE (faqs IS NULL OR faqs = '[]'::jsonb OR faqs_generated_at IS NULL)
          OR (use_cases IS NULL OR use_cases = '[]'::jsonb OR use_cases_generated_at IS NULL)
       ORDER BY votes DESC, rating DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(this.mapToTool);
  }
}

