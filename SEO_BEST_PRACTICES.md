# SEO Best Practices & Duplicate Detection

## Overview

The SEO Agent now includes comprehensive duplicate detection, semantic uniqueness checks, and SEO best practices validation to ensure all generated pages meet high-quality SEO standards.

## Features

### 1. **Semantic Uniqueness Detection**

#### How It Works:
- **AI-Powered Similarity Check**: Uses Gemini to analyze if two keywords target the same search intent
- **String Matching**: Quick pre-check using word overlap analysis
- **Context-Aware**: Considers existing pages to avoid semantic duplicates

#### Detection Levels:
1. **Exact Slug Match** (100% duplicate) - Rejected immediately
2. **High Keyword Similarity** (>80% word overlap) - Rejected
3. **Semantic Similarity** (>60% overlap) - AI analysis to determine if duplicate
4. **AI Semantic Check** - Gemini evaluates search intent and content similarity

#### Example:
- ✅ "Best AI Video Editing Tools" vs "AI Video Generation Software" - Different (different intent)
- ❌ "Best AI Tools 2026" vs "Top AI Tools 2026" - Duplicate (same intent)
- ❌ "AI Writing Tools" vs "AI Text Generation Tools" - Duplicate (semantically identical)

### 2. **SEO Best Practices Validation**

#### Title Validation:
- ✅ **Optimal**: 50-60 characters
- ⚠️ **Warning**: 30-49 or 61-70 characters
- ❌ **Issue**: <30 or >70 characters (truncated in search results)

#### Meta Description Validation:
- ✅ **Optimal**: 120-160 characters
- ⚠️ **Warning**: <120 or >160 characters
- ❌ **Issue**: <120 characters (may not display properly)

#### Keyword Optimization:
- ✅ Primary keyword in title
- ✅ Primary keyword in meta description
- ✅ Keyword density: 1-2% (natural usage, not stuffing)
- ⚠️ Warning if density <0.5% or >3%

#### Content Quality:
- ✅ Minimum 1000 words (recommended 1500+)
- ✅ 3-5 content sections with proper H2/H3 structure
- ✅ Introduction, main sections, and conclusion
- ✅ Natural keyword usage throughout

### 3. **SEO Quality Score**

Each page receives a **0-100 SEO score** based on:

**Scoring Factors:**
- **Validation Issues**: -15 points per critical issue
- **Validation Warnings**: -5 points per warning
- **Search Volume**: +5 for >5000, -10 for <1000
- **Competition**: +10 for <30, -10 for >70
- **Content Structure**: +5 for 5+ sections

**Score Interpretation:**
- **90-100**: Excellent SEO quality
- **70-89**: Good SEO quality
- **50-69**: Acceptable, but needs improvement
- **<50**: Poor SEO quality (may not be published)

### 4. **Canonical URL Management**

- Each page has a unique canonical URL
- Prevents duplicate content issues
- Format: `https://tools.10ex.ai/seo/[slug]`
- Automatically set in metadata

### 5. **Validation Tracking**

All validation issues and warnings are stored in the database:
- **Issues**: Critical problems that must be fixed
- **Warnings**: Recommendations for improvement
- Stored in `validation_issues` JSONB column
- Can be reviewed and addressed later

## Database Schema Updates

New columns added to `toolbox_seo_pages`:

```sql
canonical_url TEXT,              -- Canonical URL for this page
seo_score INTEGER DEFAULT 0,     -- SEO quality score (0-100)
validation_issues JSONB DEFAULT '[]'  -- Array of validation issues/warnings
```

## Workflow

### Page Generation Process:

1. **Research Phase**
   - Gemini identifies 3-5 SEO opportunities
   - Prompts emphasize semantic uniqueness

2. **Duplicate Check**
   - Check exact slug match
   - Check keyword similarity (>60% overlap)
   - AI semantic similarity check if needed
   - Skip if duplicate found

3. **Content Generation**
   - Generate full page content (1500-2000 words)
   - Include proper H2/H3 structure
   - Natural keyword usage (1-2% density)

4. **SEO Validation**
   - Validate title length and keyword inclusion
   - Validate meta description
   - Check keyword density
   - Verify content length and structure
   - Calculate SEO score

5. **Save to Database**
   - Store all validation results
   - Set canonical URL
   - Save SEO score
   - Mark as published if score >50

## Best Practices Enforced

### ✅ Content Requirements:
- Minimum 1500 words
- 3-5 content sections
- Proper heading hierarchy (H2, H3)
- Introduction and conclusion
- Natural keyword usage

### ✅ Technical SEO:
- Unique canonical URLs
- Proper meta tags
- Structured data (JSON-LD)
- Featured images (1200x630)
- Mobile-friendly structure

### ✅ On-Page SEO:
- Keyword in title (first 60 chars)
- Keyword in meta description
- Keyword in first paragraph
- Related keywords throughout
- Internal linking opportunities

### ✅ Content Quality:
- Unique, valuable content
- No keyword stuffing
- Proper grammar and readability
- Specific insights and recommendations
- Tool comparisons and features

## Monitoring & Reporting

### Logs Include:
- Duplicate detection results
- SEO validation issues/warnings
- SEO score for each page
- Similar pages found (if any)

### Database Queries:

**View all pages with SEO scores:**
```sql
SELECT slug, keyword, title, seo_score, validation_issues 
FROM toolbox_seo_pages 
ORDER BY seo_score DESC;
```

**Find pages with issues:**
```sql
SELECT slug, keyword, validation_issues 
FROM toolbox_seo_pages 
WHERE jsonb_array_length(validation_issues) > 0;
```

**Check for potential duplicates:**
```sql
SELECT keyword, slug, seo_score 
FROM toolbox_seo_pages 
WHERE seo_score < 50;
```

## Migration Required

Run the migration to add new columns:

```bash
npm run db:migrate
```

This will add:
- `canonical_url` column
- `seo_score` column
- `validation_issues` JSONB column

## Benefits

1. **No Duplicate Content**: Semantic uniqueness ensures each page targets distinct search intent
2. **SEO Compliance**: All pages meet Google's best practices
3. **Quality Control**: SEO score helps identify pages needing improvement
4. **Canonical URLs**: Prevents duplicate content penalties
5. **Validation Tracking**: Issues stored for review and improvement

## Future Enhancements

Potential improvements:
- Content freshness scoring
- Internal linking suggestions
- Related page recommendations
- A/B testing for titles/descriptions
- Performance metrics tracking
- Search console integration
