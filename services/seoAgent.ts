// SEO Agent - Uses Google Gemini to research SEO keywords and generate full pages
import { GoogleGenAI } from "@google/genai";
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { SEOPagesRepository } from '@/database/repositories/seoPages.repository';
import { Category } from '@/types';

interface SEOResearchResult {
  keyword: string;
  slug: string;
  title: string;
  metaDescription: string;
  searchVolume: number;
  competitionScore: number; // 0-100
  targetKeywords: string[];
  contentSections: Array<{
    heading: string;
    content: string;
    type: 'introduction' | 'comparison' | 'features' | 'pricing' | 'conclusion';
  }>;
  relatedToolIds: string[];
}

interface SEOPageContent {
  introduction: string;
  sections: Array<{
    heading: string;
    content: string;
    type: string;
  }>;
  conclusion: string;
  structuredData: any;
}

/**
 * Generate slug from keyword
 */
function generateSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Check semantic similarity between two keywords using Gemini
 */
async function checkSemanticSimilarity(keyword1: string, keyword2: string, existingPages: any[]): Promise<{ isSimilar: boolean; similarityScore: number; reason?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    // Fallback to simple string matching if API key not available
    const normalized1 = keyword1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const normalized2 = keyword2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words1 = new Set(normalized1.split(/\s+/));
    const words2 = new Set(normalized2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    const similarity = intersection.size / union.size;
    return { isSimilar: similarity > 0.7, similarityScore: similarity };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Get sample keywords from existing pages for context
    const existingKeywords = existingPages.slice(0, 5).map(p => p.keyword).join(', ');
    
    const prompt = `You are an SEO expert. Analyze if these two keywords are semantically similar or would create duplicate content.

Keyword 1: "${keyword1}"
Keyword 2: "${keyword2}"

Existing pages on the site: ${existingKeywords || 'None'}

Consider:
1. Do they target the same search intent?
2. Would they rank for the same queries?
3. Would the content be substantially similar?
4. Are they variations of the same topic?

Respond with JSON:
{
  "isSimilar": true/false,
  "similarityScore": 0.0-1.0,
  "reason": "Brief explanation"
}

Return ONLY valid JSON, no additional text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0] || jsonMatch[1] || '{}');
      return {
        isSimilar: result.isSimilar === true || result.similarityScore > 0.7,
        similarityScore: result.similarityScore || 0,
        reason: result.reason,
      };
    }
  } catch (error) {
    console.warn('Error checking semantic similarity, using fallback:', error);
  }

  // Fallback to simple matching
  const normalized1 = keyword1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const normalized2 = keyword2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words1 = new Set(normalized1.split(/\s+/));
  const words2 = new Set(normalized2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const similarity = intersection.size / union.size;
  return { isSimilar: similarity > 0.7, similarityScore: similarity };
}

/**
 * Validate SEO best practices
 */
function validateSEOBestPractices(page: {
  title: string;
  metaDescription: string;
  keyword: string;
  introduction: string;
  sections: Array<{ heading: string; content: string }>;
}): { isValid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Title validation (50-60 chars optimal, max 70)
  if (page.title.length < 30) {
    issues.push(`Title too short (${page.title.length} chars, minimum 30)`);
  } else if (page.title.length > 70) {
    warnings.push(`Title may be truncated in search results (${page.title.length} chars, optimal 50-60)`);
  }

  // Meta description validation (120-160 chars optimal, max 160)
  if (page.metaDescription.length < 120) {
    issues.push(`Meta description too short (${page.metaDescription.length} chars, minimum 120)`);
  } else if (page.metaDescription.length > 160) {
    warnings.push(`Meta description may be truncated (${page.metaDescription.length} chars, optimal 120-160)`);
  }

  // Keyword in title
  const titleLower = page.title.toLowerCase();
  const keywordLower = page.keyword.toLowerCase();
  if (!titleLower.includes(keywordLower)) {
    warnings.push('Primary keyword not found in title');
  }

  // Keyword in meta description
  if (!page.metaDescription.toLowerCase().includes(keywordLower)) {
    warnings.push('Primary keyword not found in meta description');
  }

  // Content length validation (minimum 1000 words for SEO)
  const totalContent = `${page.introduction} ${page.sections.map(s => `${s.heading} ${s.content}`).join(' ')}`;
  const wordCount = totalContent.split(/\s+/).length;
  if (wordCount < 1000) {
    warnings.push(`Content may be too short (${wordCount} words, recommended 1500+ for SEO)`);
  }

  // H1/H2 structure validation
  if (page.sections.length < 3) {
    warnings.push('Few content sections (recommended 3-5 sections for better SEO)');
  }

  // Keyword density check (should be 1-2%, not keyword stuffing)
  const keywordMatches = (totalContent.toLowerCase().match(new RegExp(keywordLower.split(' ').join('|'), 'g')) || []).length;
  const keywordDensity = (keywordMatches / wordCount) * 100;
  if (keywordDensity > 3) {
    warnings.push(`High keyword density (${keywordDensity.toFixed(1)}%, optimal 1-2%)`);
  } else if (keywordDensity < 0.5) {
    warnings.push(`Low keyword density (${keywordDensity.toFixed(1)}%, optimal 1-2%)`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Check for duplicate or semantically similar pages
 */
async function checkForDuplicates(
  newKeyword: string,
  newSlug: string,
  seoPagesRepo: SEOPagesRepository
): Promise<{ isDuplicate: boolean; reason?: string; similarPage?: any }> {
  // Get all existing pages
  const existingPages = await seoPagesRepo.findAll({ published: true });
  
  // Check exact slug match
  const exactMatch = existingPages.find(p => p.slug === newSlug);
  if (exactMatch) {
    return { isDuplicate: true, reason: 'Exact slug match', similarPage: exactMatch };
  }

  // Check for similar keywords (simple string matching first)
  const normalizedNew = newKeyword.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  for (const existing of existingPages) {
    const normalizedExisting = existing.keyword.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    // Quick check: if keywords are very similar (high word overlap)
    const wordsNew = new Set(normalizedNew.split(/\s+/));
    const wordsExisting = new Set(normalizedExisting.split(/\s+/));
    const intersection = new Set([...wordsNew].filter(x => wordsExisting.has(x)));
    const union = new Set([...wordsNew, ...wordsExisting]);
    const quickSimilarity = intersection.size / union.size;
    
    if (quickSimilarity > 0.8) {
      // Very similar, likely duplicate
      return { isDuplicate: true, reason: `High keyword similarity (${(quickSimilarity * 100).toFixed(0)}%)`, similarPage: existing };
    }
    
    if (quickSimilarity > 0.6) {
      // Potentially similar, check with AI
      const semanticCheck = await checkSemanticSimilarity(newKeyword, existing.keyword, existingPages);
      if (semanticCheck.isSimilar) {
        return { 
          isDuplicate: true, 
          reason: `Semantically similar: ${semanticCheck.reason || 'Similar search intent'}`,
          similarPage: existing 
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Calculate SEO quality score (0-100)
 */
function calculateSEOScore(
  validation: { isValid: boolean; issues: string[]; warnings: string[] },
  opportunity: SEOResearchResult,
  pageContent: SEOPageContent
): number {
  let score = 100;

  // Deduct points for issues (critical)
  score -= validation.issues.length * 15;

  // Deduct points for warnings (minor)
  score -= validation.warnings.length * 5;

  // Bonus for good search volume
  if (opportunity.searchVolume > 5000) {
    score += 5;
  } else if (opportunity.searchVolume < 1000) {
    score -= 10;
  }

  // Bonus for low competition
  if (opportunity.competitionScore < 30) {
    score += 10;
  } else if (opportunity.competitionScore > 70) {
    score -= 10;
  }

  // Bonus for good content structure
  if (pageContent.sections.length >= 5) {
    score += 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Research SEO opportunities using Gemini
 */
async function researchSEOKeywords(): Promise<SEOResearchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Use Gemini to research SEO opportunities
    const prompt = `You are an SEO research expert specializing in AI tools and software directories.

Today's Date: ${currentDate}

Your task is to identify 3-5 high-value SEO keyword opportunities for an AI tools directory website (tools.10ex.ai). 

IMPORTANT REQUIREMENTS:
1. Keywords must be SEMANTICALLY UNIQUE - avoid variations of the same topic
2. Each keyword should target a DISTINCT search intent
3. Keywords with good search volume (1000+ monthly searches)
4. Low to medium competition
5. High commercial intent
6. Relevance to AI tools, software, and productivity
7. Avoid duplicate or near-duplicate keywords (e.g., don't suggest both "best AI tools" and "top AI tools")

For each keyword opportunity, provide:
- Primary keyword (e.g., "best AI video editing tools 2026")
- Estimated search volume (number)
- Competition score (0-100, where 0 is low competition)
- 3-5 related/target keywords
- Why this keyword is valuable and how it differs from similar keywords

Format your response as a JSON array:
[
  {
    "keyword": "Best AI Video Editing Tools 2026",
    "searchVolume": 5000,
    "competitionScore": 45,
    "targetKeywords": ["AI video editor", "automated video editing", "AI video tools"],
    "reasoning": "High search volume with growing interest in AI-powered video editing. Distinct from image editing tools."
  }
]

Return ONLY valid JSON, no additional text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const text = response.text || '';
    
    // Extract JSON from response
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    }

    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0] || jsonMatch[1] || '[]');
        return results.map((r: any) => ({
          keyword: r.keyword,
          slug: generateSlug(r.keyword),
          title: `Best ${r.keyword} for 2026`,
          metaDescription: `Discover the best ${r.keyword.toLowerCase()} in 2026. Comprehensive guide with reviews, comparisons, and recommendations.`,
          searchVolume: r.searchVolume || 0,
          competitionScore: r.competitionScore || 50,
          targetKeywords: r.targetKeywords || [],
          contentSections: [], // Will be generated separately
          relatedToolIds: [], // Will be populated based on keyword
        }));
      } catch (parseError) {
        console.error('Error parsing SEO research JSON:', parseError);
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error('Error researching SEO keywords:', error);
    throw error;
  }
}

/**
 * Generate full page content for a keyword using Gemini
 */
async function generatePageContent(keyword: string, relatedTools: any[]): Promise<SEOPageContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const toolsList = relatedTools.slice(0, 10).map((tool, idx) => 
      `${idx + 1}. ${tool.name} - ${tool.tagline} (Rating: ${tool.rating}%)`
    ).join('\n');

    const prompt = `You are a professional SEO content writer specializing in AI tools and software reviews.

Keyword: "${keyword}"

Related AI Tools:
${toolsList || 'No specific tools provided'}

Create a comprehensive, SEO-optimized page about "${keyword}" for an AI tools directory website.

Requirements:
1. Write engaging, informative content (1500-2000 words total)
2. Include natural keyword usage (don't stuff keywords)
3. Structure with clear headings (H2, H3)
4. Include an introduction, main sections, and conclusion
5. Make it valuable for readers searching for this topic
6. Include comparisons, features, and recommendations

FORMATTING STYLE:
- Use single asterisks (*text*) for emphasis, NOT double asterisks (**text**)
- Use bullet points with asterisks (*) for lists
- Break content into short, readable paragraphs (2-4 sentences each)
- Use clear, descriptive subheadings
- Make content scannable with proper spacing
- Write in a clean, professional style

Structure:
- Introduction (2-3 paragraphs)
- Main sections (3-5 sections with headings, each with bullet points and clear formatting)
- Conclusion (1-2 paragraphs)

Format your response as JSON:
{
  "introduction": "2-3 paragraph introduction...",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Section content (2-3 paragraphs)...",
      "type": "introduction|comparison|features|pricing|conclusion"
    }
  ],
  "conclusion": "1-2 paragraph conclusion...",
  "structuredData": {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Best ${keyword} for 2026",
    "description": "..."
  }
}

Return ONLY valid JSON, no additional text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const text = response.text || '';
    
    // Extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    }

    if (jsonMatch) {
      try {
        const content = JSON.parse(jsonMatch[0] || jsonMatch[1] || '{}');
        
        // Validate and clean structuredData
        let structuredData = content.structuredData || {};
        if (typeof structuredData === 'string') {
          try {
            structuredData = JSON.parse(structuredData);
          } catch (e) {
            console.warn('Failed to parse structuredData string, using default');
            structuredData = {};
          }
        }
        
        // Ensure structuredData is a valid object
        if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) {
          structuredData = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `Best ${keyword} for 2026`,
            "description": `Comprehensive guide to the best ${keyword.toLowerCase()} in 2026`,
          };
        }
        
        return {
          introduction: content.introduction || '',
          sections: content.sections || [],
          conclusion: content.conclusion || '',
          structuredData: structuredData,
        };
      } catch (parseError) {
        console.error('Error parsing page content JSON:', parseError);
        throw new Error('Failed to parse generated content');
      }
    }

    throw new Error('No valid JSON found in Gemini response');
  } catch (error) {
    console.error('Error generating page content:', error);
    throw error;
  }
}

/**
 * Generate featured image using Gemini and upload to S3
 * Returns S3 URL (never base64 data URI)
 */
async function generateFeaturedImage(keyword: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, using placeholder image');
    return getPlaceholderImage(keyword);
  }

  try {
    // Import S3 service
    const { uploadImageToS3, generateImageFilename } = await import('./s3Service');
    
    // Create a descriptive prompt for the featured image
    const imagePrompt = `Create a professional, modern featured image for an SEO article about "${keyword}". 
    
Requirements:
- Clean, minimalist design with modern aesthetics
- Professional color scheme (blues, purples, or tech-inspired colors)
- 1200x630 pixels aspect ratio (landscape)
- Abstract or conceptual representation of AI tools and technology
- No text overlays, just visual elements
- High quality, suitable for website header/featured image
- Professional and trustworthy appearance

Style: Modern tech, minimalist, clean, professional`;

    console.log(`   🎨 Generating AI image with Gemini...`);

    // Use Gemini REST API for image generation
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: imagePrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Extract image from response
        if (data.candidates && data.candidates[0]?.content?.parts) {
          const parts = data.candidates[0].content.parts;
          const imagePart = parts.find((p: any) => p.inlineData);
          
          if (imagePart?.inlineData?.data) {
            const base64Data = imagePart.inlineData.data; // This is already base64 string (not data URI)
            const mimeType = imagePart.inlineData.mimeType || 'image/png';
            
            // Upload to S3 instead of using base64 data URI
            console.log(`   📤 Uploading image to S3...`);
            const filename = generateImageFilename(keyword, mimeType.split('/')[1] || 'png');
            const s3Url = await uploadImageToS3(base64Data, filename, mimeType);
            
            if (s3Url) {
              console.log(`   ✅ Image uploaded to S3: ${s3Url}`);
              return s3Url;
            } else {
              console.warn(`   ⚠️  S3 upload failed, falling back to Unsplash`);
            }
          }
        }
        
        console.warn(`   ⚠️  Image generation response didn't contain image data`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`   ⚠️  Image generation API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (apiError: any) {
      console.warn(`   ⚠️  Image generation API call failed: ${apiError?.message || 'Unknown error'}`);
    }
    
    // Fallback to Unsplash if available
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashAccessKey) {
      try {
        const searchQuery = keyword.toLowerCase()
          .replace(/best |top |for |in |2026|ai |tools?/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50);
        
        console.log(`   🖼️  Fetching image from Unsplash for: ${searchQuery}`);
        
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashAccessKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            console.log(`   ✅ Using Unsplash image`);
            return data.results[0].urls.regular;
          }
        }
      } catch (unsplashError) {
        console.warn('Unsplash fetch failed:', unsplashError);
      }
    }

    // Final fallback to placeholder (external URL, never base64)
    console.log(`   ⚠️  Using placeholder image (external URL)`);
    return getPlaceholderImage(keyword);
    
  } catch (error) {
    console.error('Error generating featured image:', error);
    return getPlaceholderImage(keyword);
  }
}

/**
 * Get placeholder image (fallback)
 */
function getPlaceholderImage(keyword: string): string {
  const searchQuery = keyword.toLowerCase()
    .replace(/best |top |for |in |2026|ai |tools?/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  // Use Picsum with deterministic seed based on keyword
  const seed = Buffer.from(searchQuery).toString('base64').substring(0, 10);
  return `https://picsum.photos/seed/${seed}/1200/630`;
}

/**
 * Find related tools for a keyword
 */
function findRelatedTools(keyword: string, allTools: any[]): any[] {
  const lowerKeyword = keyword.toLowerCase();
  
  // Simple keyword matching - can be enhanced
  return allTools
    .filter(tool => {
      const searchText = `${tool.name} ${tool.tagline} ${tool.category}`.toLowerCase();
      return searchText.includes(lowerKeyword) || 
             lowerKeyword.split(' ').some(word => searchText.includes(word));
    })
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 20);
}

/**
 * Main function: Research SEO and generate pages
 */
export async function generateSEOPages(): Promise<{ researched: number; generated: number; errors: number }> {
  const toolsRepo = new ToolsRepository();
  const seoPagesRepo = new SEOPagesRepository();
  let researched = 0;
  let generated = 0;
  let errors = 0;

  try {
    console.log('🔍 Starting SEO research...');
    
    // Step 1: Research SEO keywords
    const seoOpportunities = await researchSEOKeywords();
    researched = seoOpportunities.length;
    console.log(`   Found ${researched} SEO opportunities`);

    // Step 2: Get all tools for matching
    const allTools = await toolsRepo.findAll();
    console.log(`   Loaded ${allTools.length} tools from database`);

    // Step 3: Generate pages for each opportunity
    for (const opportunity of seoOpportunities) {
      try {
        console.log(`\n📄 Generating page for: ${opportunity.keyword}`);
        
        // Check if page already exists
        const existing = await seoPagesRepo.findBySlug(opportunity.slug);
        if (existing) {
          console.log(`   ⊘ Page already exists, skipping...`);
          continue;
        }
        
        // Find related tools
        const relatedTools = findRelatedTools(opportunity.keyword, allTools);
        console.log(`   Found ${relatedTools.length} related tools`);

        if (relatedTools.length === 0) {
          console.log(`   ⚠️  Skipping - no related tools found`);
          errors++;
          continue;
        }

        // Check for duplicates and semantic similarity
        console.log(`   🔍 Checking for duplicates and semantic similarity...`);
        const duplicateCheck = await checkForDuplicates(opportunity.keyword, opportunity.slug, seoPagesRepo);
        if (duplicateCheck.isDuplicate) {
          console.log(`   ⊘ Skipping duplicate: ${duplicateCheck.reason}`);
          if (duplicateCheck.similarPage) {
            console.log(`      Similar to existing page: ${duplicateCheck.similarPage.keyword}`);
          }
          errors++;
          continue;
        }
        console.log(`   ✅ No duplicates found`);

        // Generate page content
        const pageContent = await generatePageContent(opportunity.keyword, relatedTools);
        console.log(`   ✅ Generated content with ${pageContent.sections.length} sections`);

        // Validate SEO best practices
        console.log(`   ✅ Validating SEO best practices...`);
        const seoValidation = validateSEOBestPractices({
          title: opportunity.title,
          metaDescription: opportunity.metaDescription,
          keyword: opportunity.keyword,
          introduction: pageContent.introduction,
          sections: pageContent.sections,
        });

        if (seoValidation.issues.length > 0) {
          console.log(`   ⚠️  SEO Issues found:`);
          seoValidation.issues.forEach(issue => console.log(`      - ${issue}`));
        }
        if (seoValidation.warnings.length > 0) {
          console.log(`   ⚠️  SEO Warnings:`);
          seoValidation.warnings.forEach(warning => console.log(`      - ${warning}`));
        }
        if (seoValidation.isValid && seoValidation.warnings.length === 0) {
          console.log(`   ✅ SEO validation passed`);
        }

        // Generate featured image
        console.log(`   🖼️  Generating featured image...`);
        const featuredImageUrl = await generateFeaturedImage(opportunity.keyword);
        console.log(`   ✅ Featured image: ${featuredImageUrl}`);

        // Calculate SEO score (0-100)
        const seoScore = calculateSEOScore(seoValidation, opportunity, pageContent);
        console.log(`   📊 SEO Score: ${seoScore}/100`);

        // Generate canonical URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
        const canonicalUrl = `${baseUrl}/seo/${opportunity.slug}`;

        // Save to database
        await seoPagesRepo.upsert({
          id: opportunity.slug, // Use slug as ID
          slug: opportunity.slug,
          keyword: opportunity.keyword,
          title: opportunity.title,
          metaDescription: opportunity.metaDescription,
          featuredImageUrl: featuredImageUrl || null,
          content: '', // Will be generated from sections
          introduction: pageContent.introduction,
          sections: pageContent.sections as any, // Type assertion for flexibility
          targetKeywords: opportunity.targetKeywords,
          searchVolume: opportunity.searchVolume,
          competitionScore: opportunity.competitionScore,
          relatedToolIds: relatedTools
            .map(t => t?.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0), // Ensure valid string IDs only
          structuredData: pageContent.structuredData,
          canonicalUrl: canonicalUrl,
          seoScore: seoScore,
          validationIssues: [...seoValidation.issues, ...seoValidation.warnings],
          isPublished: true,
          lastGeneratedAt: new Date(),
        });

        console.log(`   💾 Saved to database`);
        generated++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`   ❌ Error generating page for ${opportunity.keyword}:`, error);
        errors++;
      }
    }

    console.log(`\n📊 Summary: Researched ${researched}, Generated ${generated}, Errors ${errors}`);
    return { researched, generated, errors };
  } catch (error) {
    console.error('Error in SEO page generation:', error);
    throw error;
  }
}

/**
 * Generate a single SEO page (for testing or manual generation)
 */
export async function generateSingleSEOPage(keyword: string): Promise<SEOResearchResult | null> {
  const toolsRepo = new ToolsRepository();
  
  try {
    const allTools = await toolsRepo.findAll();
    const relatedTools = findRelatedTools(keyword, allTools);
    
    if (relatedTools.length === 0) {
      throw new Error('No related tools found for keyword');
    }

    const pageContent = await generatePageContent(keyword, relatedTools);
    
    return {
      keyword,
      slug: generateSlug(keyword),
      title: `Best ${keyword} for 2026`,
      metaDescription: `Discover the best ${keyword.toLowerCase()} in 2026. Comprehensive guide with reviews and recommendations.`,
      searchVolume: 0,
      competitionScore: 50,
      targetKeywords: keyword.split(' '),
      contentSections: pageContent.sections as any, // Type assertion for flexibility
      relatedToolIds: relatedTools.map(t => t.id),
    };
  } catch (error) {
    console.error(`Error generating single SEO page for ${keyword}:`, error);
    return null;
  }
}
