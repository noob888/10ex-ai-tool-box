// News repository - database operations for AI news articles
import { getDatabasePool } from '../connection';
import { DatabaseNews } from '../schema';

export interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  fetchedAt: Date;
  category: string;
  tags: string[];
  viewCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NewsRepository {
  /**
   * Get all news articles with optional filters
   */
  async findAll(filters?: {
    limit?: number;
    offset?: number;
    featured?: boolean;
    category?: string;
    source?: string;
  }): Promise<NewsArticle[]> {
    try {
      const pool = getDatabasePool();
      let query = 'SELECT * FROM toolbox_news WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.featured !== undefined) {
        query += ` AND is_featured = $${paramIndex}`;
        params.push(filters.featured);
        paramIndex++;
      }

      if (filters?.category) {
        query += ` AND category = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters?.source) {
        query += ` AND source = $${paramIndex}`;
        params.push(filters.source);
        paramIndex++;
      }

      query += ' ORDER BY published_at DESC';

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
      return result.rows.map(this.mapToNews);
    } catch (error: any) {
      // Handle case where table doesn't exist yet
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('News table does not exist yet. Run migration: npm run db:migrate');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a single news article by ID
   */
  async findById(id: string): Promise<NewsArticle | null> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'SELECT * FROM toolbox_news WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapToNews(result.rows[0]) : null;
  }

  /**
   * Get a single news article by URL
   */
  async findByUrl(url: string): Promise<NewsArticle | null> {
    try {
      const pool = getDatabasePool();
      const result = await pool.query(
        'SELECT * FROM toolbox_news WHERE url = $1',
        [url]
      );
      return result.rows.length > 0 ? this.mapToNews(result.rows[0]) : null;
    } catch (error: any) {
      // Handle case where table doesn't exist yet
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('News table does not exist yet. Run migration: npm run db:migrate');
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update a news article
   */
  async upsert(news: Omit<NewsArticle, 'createdAt' | 'updatedAt' | 'fetchedAt' | 'viewCount'>): Promise<NewsArticle> {
    try {
      const pool = getDatabasePool();
      
      // Check if article with this URL already exists
      const existing = await this.findByUrl(news.url);
      if (existing) {
        // Update existing article
        const tagsArray = Array.isArray(news.tags) ? news.tags : (news.tags ? [news.tags] : []);
        const result = await pool.query(
          `UPDATE toolbox_news SET 
            title = $1,
            description = $2,
            source = $3,
            author = $4,
            image_url = $5,
            published_at = $6,
            category = $7,
            tags = $8,
            is_featured = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE url = $10
          RETURNING *`,
          [
            news.title,
            news.description,
            news.source,
            news.author,
            news.imageUrl,
            news.publishedAt,
            news.category,
            tagsArray,
            news.isFeatured || false,
            news.url,
          ]
        );
        return this.mapToNews(result.rows[0]);
      }
      
      // Generate unique ID - use URL hash with timestamp to ensure uniqueness
      const id = news.id || this.generateId(news.url);
      
      // Ensure tags is an array (pg library handles array conversion automatically)
      const tagsArray = Array.isArray(news.tags) ? news.tags : (news.tags ? [news.tags] : []);
      
      // Try to insert, but handle ID conflicts by generating a new ID
      let attempts = 0;
      let currentId = id;
      while (attempts < 3) {
        try {
          const result = await pool.query(
            `INSERT INTO toolbox_news (
              id, title, description, url, source, author, image_url, 
              published_at, category, tags, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
              currentId,
              news.title,
              news.description,
              news.url,
              news.source,
              news.author,
              news.imageUrl,
              news.publishedAt,
              news.category,
              tagsArray,
              news.isFeatured || false,
            ]
          );
          return this.mapToNews(result.rows[0]);
        } catch (insertError: any) {
          // Handle unique constraint violations (code 23505)
          if (insertError?.code === '23505') {
            // Check if it's a URL constraint violation
            if (insertError?.constraint?.includes('url') || insertError?.message?.includes('url')) {
              // URL already exists, update it instead
              try {
                const updateResult = await pool.query(
                  `UPDATE toolbox_news SET 
                    title = $1,
                    description = $2,
                    source = $3,
                    author = $4,
                    image_url = $5,
                    published_at = $6,
                    category = $7,
                    tags = $8,
                    is_featured = $9,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE url = $10
                  RETURNING *`,
                  [
                    news.title,
                    news.description,
                    news.source,
                    news.author,
                    news.imageUrl,
                    news.publishedAt,
                    news.category,
                    tagsArray,
                    news.isFeatured || false,
                    news.url,
                  ]
                );
                if (updateResult.rows.length > 0) {
                  return this.mapToNews(updateResult.rows[0]);
                }
              } catch (updateError: any) {
                // If update fails, continue to ID regeneration
                console.warn('Update failed, trying new ID:', updateError?.message);
              }
            }
            
            // If ID conflict (primary key), generate a new ID with timestamp
            if (insertError?.constraint?.includes('pkey') || insertError?.constraint === 'toolbox_news_pkey' || 
                insertError?.message?.includes('toolbox_news_pkey') || insertError?.message?.includes('duplicate key')) {
              attempts++;
              if (attempts < 3) {
                currentId = `${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                continue;
              }
            }
          }
          
          // If we've exhausted retries or it's a different error, throw it
          throw insertError;
        }
      }
      
      throw new Error('Failed to insert article after multiple ID generation attempts');
    } catch (error: any) {
      // Handle case where table doesn't exist yet
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        throw new Error('News table does not exist. Please run: npm run db:migrate');
      }
      throw error;
    }
  }

  /**
   * Increment view count for an article
   */
  async incrementViewCount(id: string): Promise<void> {
    const pool = getDatabasePool();
    await pool.query(
      'UPDATE toolbox_news SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Mark articles as featured
   */
  async setFeatured(id: string, featured: boolean): Promise<void> {
    const pool = getDatabasePool();
    await pool.query(
      'UPDATE toolbox_news SET is_featured = $1 WHERE id = $2',
      [featured, id]
    );
  }

  /**
   * Delete old articles (older than specified days)
   */
  async deleteOldArticles(daysOld: number = 30): Promise<number> {
    const pool = getDatabasePool();
    const result = await pool.query(
      'DELETE FROM toolbox_news WHERE published_at < NOW() - INTERVAL \'$1 days\'',
      [daysOld]
    );
    return result.rowCount || 0;
  }

  /**
   * Delete a news article by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      const pool = getDatabasePool();
      const result = await pool.query(
        'DELETE FROM toolbox_news WHERE id = $1',
        [id]
      );
      return (result.rowCount || 0) > 0;
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('News table does not exist yet. Run migration: npm run db:migrate');
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete multiple news articles by IDs
   */
  async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    
    try {
      const pool = getDatabasePool();
      const result = await pool.query(
        'DELETE FROM toolbox_news WHERE id = ANY($1)',
        [ids]
      );
      return result.rowCount || 0;
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('News table does not exist yet. Run migration: npm run db:migrate');
        return 0;
      }
      throw error;
    }
  }

  /**
   * Map database row to NewsArticle
   */
  private mapToNews(row: any): NewsArticle {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      source: row.source,
      author: row.author,
      imageUrl: row.image_url,
      publishedAt: new Date(row.published_at),
      fetchedAt: new Date(row.fetched_at),
      category: row.category || 'AI',
      tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags) : []),
      viewCount: row.view_count || 0,
      isFeatured: row.is_featured || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Generate ID from URL
   */
  private generateId(url: string): string {
    // Create a hash-like ID from URL
    return Buffer.from(url).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 50);
  }
}

