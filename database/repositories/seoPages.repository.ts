// SEO Pages repository - database operations for dynamically generated SEO pages
import { getDatabasePool } from '../connection';

export interface SEOPage {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  content: string;
  introduction: string | null;
  sections: Array<{
    heading: string;
    content: string;
    type: string;
  }>;
  targetKeywords: string[];
  searchVolume: number;
  competitionScore: number;
  relatedToolIds: string[];
  structuredData: any;
  canonicalUrl: string | null;
  seoScore: number;
  validationIssues: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedAt: Date | null;
}

export class SEOPagesRepository {
  /**
   * Get all SEO pages with optional filters
   */
  async findAll(filters?: {
    limit?: number;
    offset?: number;
    published?: boolean;
    keyword?: string; // Filter by keyword
  }): Promise<SEOPage[]> {
    try {
      const pool = getDatabasePool();
      let query = 'SELECT * FROM toolbox_seo_pages WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.published !== undefined) {
        query += ` AND is_published = $${paramIndex}`;
        params.push(filters.published);
        paramIndex++;
      }
      if (filters?.keyword) {
        query += ` AND keyword ILIKE $${paramIndex}`;
        params.push(`%${filters.keyword}%`);
        paramIndex++;
      }

      query += ' ORDER BY updated_at DESC';

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
      return result.rows.map(this.mapToSEOPage);
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('SEO pages table does not exist yet. Run migration: npm run db:migrate');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a single SEO page by slug
   */
  async findBySlug(slug: string): Promise<SEOPage | null> {
    try {
      const pool = getDatabasePool();
      const result = await pool.query(
        'SELECT * FROM toolbox_seo_pages WHERE slug = $1',
        [slug]
      );
      return result.rows.length > 0 ? this.mapToSEOPage(result.rows[0]) : null;
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('SEO pages table does not exist yet. Run migration: npm run db:migrate');
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update an SEO page
   */
  async upsert(page: Omit<SEOPage, 'createdAt' | 'updatedAt'>): Promise<SEOPage> {
    try {
      const pool = getDatabasePool();
      
      // Check if page with this slug already exists
      const existing = await this.findBySlug(page.slug);
      
      // Combine introduction and sections into full content
      const fullContent = [
        page.introduction || '',
        ...(page.sections || []).map(s => `## ${s.heading}\n\n${s.content}`),
      ].join('\n\n');

      // Validate and clean structuredData before saving
      let structuredDataToSave = page.structuredData || {};
      if (typeof structuredDataToSave === 'string') {
        try {
          structuredDataToSave = JSON.parse(structuredDataToSave);
        } catch (e) {
          console.warn('Failed to parse structuredData string, using default');
          structuredDataToSave = {};
        }
      }
      // Ensure it's a valid object (not array, not null)
      if (!structuredDataToSave || typeof structuredDataToSave !== 'object' || Array.isArray(structuredDataToSave)) {
        structuredDataToSave = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": page.title || `Best ${page.keyword} for 2026`,
          "description": page.metaDescription || `Comprehensive guide to the best ${page.keyword.toLowerCase()} in 2026`,
        };
      }
      
      // Validate validationIssues is an array
      const validationIssuesToSave = Array.isArray(page.validationIssues) 
        ? page.validationIssues 
        : (page.validationIssues ? [page.validationIssues] : []);
      
      // Validate relatedToolIds is a string array (stored as JSONB)
      let relatedToolIdsToSave = page.relatedToolIds || [];
      if (!Array.isArray(relatedToolIdsToSave)) {
        relatedToolIdsToSave = [];
      }
      // Ensure all items are strings and filter out invalid values
      relatedToolIdsToSave = relatedToolIdsToSave
        .filter(id => id != null && id !== undefined)
        .map(id => String(id))
        .filter(id => id.length > 0);
      
      // Validate targetKeywords is a string array (stored as TEXT[])
      let targetKeywordsToSave = page.targetKeywords || [];
      if (!Array.isArray(targetKeywordsToSave)) {
        targetKeywordsToSave = [];
      }
      // Ensure all items are strings
      targetKeywordsToSave = targetKeywordsToSave
        .filter(kw => kw != null && kw !== undefined)
        .map(kw => String(kw))
        .filter(kw => kw.length > 0);

      if (existing) {
        // Update existing page
        const result = await pool.query(
          `UPDATE toolbox_seo_pages SET 
            keyword = $1,
            title = $2,
            meta_description = $3,
            featured_image_url = $4,
            content = $5,
            introduction = $6,
            sections = $7,
            target_keywords = $8,
            search_volume = $9,
            competition_score = $10,
            related_tools = $11,
            structured_data = $12,
            is_published = $13,
            updated_at = CURRENT_TIMESTAMP,
            last_generated_at = CURRENT_TIMESTAMP
          WHERE slug = $14
          RETURNING *`,
          [
            page.keyword,
            page.title,
            page.metaDescription,
            page.featuredImageUrl || null,
            fullContent,
            page.introduction,
            JSON.stringify(page.sections || []),
            targetKeywordsToSave, // Use validated target keywords (TEXT[])
            page.searchVolume,
            page.competitionScore,
            JSON.stringify(relatedToolIdsToSave), // Use validated related tool IDs (JSONB - must be stringified)
            JSON.stringify(structuredDataToSave),
            page.isPublished !== false,
            page.slug,
          ]
        );
        return this.mapToSEOPage(result.rows[0]);
      }
      
      // Generate unique ID
      const id = page.id || this.generateId(page.slug);
      
      // Insert new page
      const result = await pool.query(
        `INSERT INTO toolbox_seo_pages (
          id, slug, keyword, title, meta_description, featured_image_url, content, introduction,
          sections, target_keywords, search_volume, competition_score,
          related_tools, structured_data, canonical_url, seo_score, validation_issues, is_published, last_generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          id,
          page.slug,
          page.keyword,
          page.title,
          page.metaDescription,
          page.featuredImageUrl || null,
          fullContent,
          page.introduction,
          JSON.stringify(page.sections || []),
          targetKeywordsToSave, // Use validated target keywords (TEXT[])
          page.searchVolume,
          page.competitionScore,
          JSON.stringify(relatedToolIdsToSave), // Use validated related tool IDs (JSONB - must be stringified)
          JSON.stringify(structuredDataToSave), // Use validated structured data
          page.canonicalUrl || null,
          page.seoScore || 0,
          JSON.stringify(validationIssuesToSave), // Use validated validation issues
          page.isPublished !== false,
        ]
      );
      return this.mapToSEOPage(result.rows[0]);
    } catch (error: any) {
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('SEO pages table does not exist yet. Run migration: npm run db:migrate');
        throw new Error('SEO pages table does not exist. Please run: npm run db:migrate');
      }
      throw error;
    }
  }

  /**
   * Map database row to SEOPage interface
   */
  private mapToSEOPage(row: any): SEOPage {
    return {
      id: row.id,
      slug: row.slug,
      keyword: row.keyword,
      title: row.title,
      metaDescription: row.meta_description,
      featuredImageUrl: row.featured_image_url || null,
      content: row.content,
      introduction: row.introduction,
      sections: Array.isArray(row.sections) ? row.sections : (row.sections ? JSON.parse(row.sections) : []),
      targetKeywords: Array.isArray(row.target_keywords) ? row.target_keywords : [],
      searchVolume: row.search_volume || 0,
      competitionScore: row.competition_score || 0,
      relatedToolIds: Array.isArray(row.related_tools) ? row.related_tools : (row.related_tools ? JSON.parse(row.related_tools) : []),
      structuredData: row.structured_data ? (typeof row.structured_data === 'object' ? row.structured_data : JSON.parse(row.structured_data)) : {},
      canonicalUrl: row.canonical_url || null,
      seoScore: row.seo_score || 0,
      validationIssues: Array.isArray(row.validation_issues) ? row.validation_issues : (row.validation_issues ? JSON.parse(row.validation_issues) : []),
      isPublished: row.is_published !== false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastGeneratedAt: row.last_generated_at ? new Date(row.last_generated_at) : null,
    };
  }

  /**
   * Generate ID from slug
   */
  private generateId(slug: string): string {
    return Buffer.from(slug).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 50);
  }
}
