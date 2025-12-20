// Prompts repository - database operations for prompt templates
// Loosely coupled from main app logic

import { getDatabasePool } from '../connection';
import { DatabasePromptTemplate } from '../schema';
import { PromptTemplate, Category } from '../../types';

export class PromptsRepository {
  /**
   * Get all prompts with optional filters
   */
  async findAll(filters?: {
    category?: Category | 'All';
    search?: string;
  }): Promise<PromptTemplate[]> {
    const pool = getDatabasePool();
    let query = 'SELECT * FROM toolbox_prompt_templates WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category && filters.category !== 'All') {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (title ILIKE $${paramIndex} OR prompt ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY copy_count DESC';

    const result = await pool.query(query, params);
    return result.rows.map(this.mapToPrompt);
  }

  /**
   * Get prompt by ID
   */
  async findById(id: string): Promise<PromptTemplate | null> {
    const pool = getDatabasePool();
    const result = await pool.query('SELECT * FROM toolbox_prompt_templates WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToPrompt(result.rows[0]);
  }

  /**
   * Increment copy count
   */
  async incrementCopyCount(id: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query('UPDATE toolbox_prompt_templates SET copy_count = copy_count + 1 WHERE id = $1', [id]);
  }

  /**
   * Create or update a prompt
   */
  async upsert(prompt: PromptTemplate): Promise<PromptTemplate> {
    const pool = getDatabasePool();
    
    const query = `
      INSERT INTO toolbox_prompt_templates (id, title, category, use_case, prompt, level, copy_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        use_case = EXCLUDED.use_case,
        prompt = EXCLUDED.prompt,
        level = EXCLUDED.level,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      prompt.id,
      prompt.title,
      prompt.category,
      prompt.useCase,
      prompt.prompt,
      prompt.level,
      prompt.copyCount || 0,
    ]);

    return this.mapToPrompt(result.rows[0]);
  }

  /**
   * Map database row to PromptTemplate entity
   */
  private mapToPrompt(row: DatabasePromptTemplate): PromptTemplate {
    return {
      id: row.id,
      title: row.title,
      category: row.category as Category,
      useCase: row.use_case,
      prompt: row.prompt,
      level: row.level as 'Beginner' | 'Advanced' | 'Pro',
      copyCount: row.copy_count,
    };
  }
}

