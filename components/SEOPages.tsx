'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Tool } from '../types';
import { ToolCard } from './ToolCard';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  keyword: string;
  targetTool?: Tool;
  alternatives?: Tool[]; // Made optional - will fetch client-side
  relatedToolIds?: string[]; // Pass IDs instead of full objects
  category?: string; // For category-based queries
  onBack?: () => void;
  onToolClick?: (tool: Tool) => void;
  onVote?: (tool: Tool) => void;
  onLike?: (tool: Tool) => void;
  onStar?: (tool: Tool) => void;
  featuredImageUrl?: string | null;
  introduction?: string | null;
  sections?: Array<{
    heading: string;
    content: string;
    type: string;
  }>;
}

/**
 * Format content with proper styling for asterisks, bullet points, etc.
 */
function formatContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentParagraph: string[] = [];
  let listItems: string[] = [];
  let listKey = 0;
  
  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={key} className="mb-5 leading-7 text-[#888]">
          {formatInlineText(currentParagraph.join(' '))}
        </p>
      );
      currentParagraph = [];
    }
  };
  
  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="list-none space-y-3 mb-6 ml-2">
          {listItems.map((item, itemIdx) => (
            <li key={`${key}-${itemIdx}`} className="flex items-start gap-3">
              <span className="text-electric-blue mt-2 font-bold text-lg">•</span>
              <span className="flex-1 leading-7 text-[#888]">{formatInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
      listKey++;
    }
  };
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Handle bullet points (lines starting with * or -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      // Close previous paragraph if exists
      flushParagraph(`para-${idx}`);
      
      // Add to list
      const listItemText = trimmed.substring(2); // Remove "* " or "- "
      listItems.push(listItemText);
    } else if (trimmed === '') {
      // Empty line - flush both paragraph and list
      flushList(`list-${listKey}`);
      flushParagraph(`para-${idx}`);
    } else {
      // Regular paragraph text
      // Flush list first if it exists
      flushList(`list-${listKey}`);
      currentParagraph.push(trimmed);
    }
  });
  
  // Flush any remaining content
  flushList(`list-final-${listKey}`);
  flushParagraph('para-final');
  
  return <>{elements}</>;
}

/**
 * Format inline text with asterisks for emphasis
 */
function formatInlineText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Match text between single asterisks (*text*)
  // But exclude patterns like "*Label:*" at the start of a line or after punctuation
  const asteriskRegex = /\*([^*]+?)\*/g;
  let match;
  
  while ((match = asteriskRegex.exec(text)) !== null) {
    const beforeChar = match.index > 0 ? text[match.index - 1] : ' ';
    const afterChar = match.index + match[0].length < text.length 
      ? text[match.index + match[0].length] 
      : ' ';
    
    // Check if it's a label pattern like "*Pricing:*" (ends with colon)
    const isLabel = match[1].endsWith(':');
    
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    if (isLabel) {
      // For labels, remove the colon from emphasis and add it after
      const labelText = match[1].slice(0, -1); // Remove trailing colon
      parts.push(
        <span key={`emph-${match.index}`} className="text-white font-semibold">
          {labelText}
        </span>
      );
      parts.push(':');
    } else {
      // Regular emphasis
      parts.push(
        <span key={`emph-${match.index}`} className="text-white font-semibold">
          {match[1]}
        </span>
      );
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
}

export const SEOSection: React.FC<Props> = ({ keyword, targetTool, alternatives, relatedToolIds, category, onBack, onToolClick, onVote, onLike, onStar, featuredImageUrl, introduction, sections }) => {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>(alternatives || []);
  const [loading, setLoading] = useState(!alternatives || alternatives.length === 0);
  const [displayedCount, setDisplayedCount] = useState(10); // Start with 10

  // Fetch tools client-side if not provided
  useEffect(() => {
    if (alternatives && alternatives.length > 0) {
      // Tools already provided (fallback)
      setTools(alternatives);
      setLoading(false);
      return;
    }

    // Fetch tools client-side
    const fetchTools = async () => {
      try {
        setLoading(true);
        let url = '/api/tools?limit=10';
        
        if (relatedToolIds && relatedToolIds.length > 0) {
          // Fetch specific tools by IDs
          const toolsPromises = relatedToolIds.slice(0, 10).map(id => 
            fetch(`/api/tools/${id}`).then(res => res.json()).then(data => data.tool).catch(() => null)
          );
          const fetchedTools = (await Promise.all(toolsPromises)).filter(Boolean);
          setTools(fetchedTools);
        } else if (category) {
          // Fetch by category
          url += `&category=${category}`;
          const response = await fetch(url);
          const data = await response.json();
          setTools(data.tools || []);
        } else {
          // Search by keyword
          url += `&search=${encodeURIComponent(keyword)}`;
          const response = await fetch(url);
          const data = await response.json();
          setTools(data.tools || []);
        }
      } catch (error) {
        console.error('Error fetching tools:', error);
        setTools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [alternatives, relatedToolIds, category, keyword]);

  // Default handlers
  const handleBack = onBack || (() => router.back());
  
  const handleToolClick = onToolClick || ((tool: Tool) => {
    router.push(`/tool/${tool.id}`);
  });
  
  const handleVote = onVote || (() => {});

  const displayedTools = useMemo(() => {
    return tools.slice(0, displayedCount);
  }, [tools, displayedCount]);

  const hasMoreTools = displayedCount < tools.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 24);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pt-8">
      <button onClick={handleBack} className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
        <ArrowLeft size={14} /> Back to Directory
      </button>

      {/* Featured Image */}
      {featuredImageUrl && (
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border border-[#1f1f1f]">
          <img
            src={featuredImageUrl}
            alt={keyword}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Best <span className="text-white">{keyword}</span> for 2026
        </h1>
        {/* Use generated introduction if available, otherwise use default */}
        {introduction ? (
          <div className="text-[#888] text-base leading-relaxed max-w-3xl space-y-5">
            {formatContent(introduction)}
          </div>
        ) : (
        <p className="text-[#888] text-base leading-relaxed max-w-3xl">
          Don't settle for marketing hype. We audited 600+ AI tools to bring you the top performing {keyword.toLowerCase()} based on latency, output quality, and cost-efficiency.
        </p>
        )}
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#444] uppercase tracking-widest">
              <span>{loading ? '...' : tools.length} Tools Found</span>
              <span className="text-[#222]">•</span>
              <span>Sorted by Rating</span>
            </div>
      </div>

      {/* Generated Content Sections */}
      {sections && sections.length > 0 && (
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-white border-b border-[#1f1f1f] pb-3">
                {section.heading}
              </h2>
              <div className="text-[#888] text-base leading-relaxed space-y-5 prose prose-invert max-w-none">
                {formatContent(section.content)}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="animate-spin text-electric-blue mx-auto mb-4" size={32} />
          <p className="text-[#666] text-sm">Loading tools...</p>
        </div>
      ) : tools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedTools.map(tool => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              onClick={handleToolClick} 
              onVote={handleVote}
              onLike={onLike || (() => {})} 
              onStar={onStar || (() => {})} 
              isLiked={false}
              isStarred={false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[#666] text-sm">No tools found.</p>
        </div>
      )}

      {hasMoreTools && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="bg-[#0a0a0a] border border-[#1f1f1f] text-white px-8 py-3 rounded-lg font-bold text-xs hover:bg-[#111] hover:border-[#333] transition-all uppercase tracking-widest flex items-center gap-2"
          >
            Load More Tools
            <ArrowRight size={14} />
          </button>
        </div>
      )}

          {!loading && tools.length > 0 && (
            <div className="p-8 rounded-lg border border-[#1f1f1f] bg-[#050505] space-y-6">
              <h2 className="text-xl font-bold">Why choose the right {keyword.toLowerCase()}?</h2>
              <p className="text-sm text-[#666] leading-relaxed">
                Finding the perfect {keyword.toLowerCase()} can make or break your workflow. We've analyzed 600+ tools to help you find the best match based on performance, pricing, and features. Our curated list ensures you get tools that actually deliver results.
              </p>
              {tools.length >= 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                    <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Top Rated</h3>
                    <p className="text-xs font-bold text-white">{tools[0]?.name || "N/A"}</p>
                    <p className="text-[10px] text-[#666] mt-1">{tools[0]?.rating}% Rating</p>
                  </div>
                  <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                    <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Best Value</h3>
                    <p className="text-xs font-bold text-white">{tools[1]?.name || "N/A"}</p>
                    <p className="text-[10px] text-[#666] mt-1">{tools[1]?.pricing} Pricing</p>
                  </div>
                  {tools[2] && (
                    <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                      <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Most Popular</h3>
                      <p className="text-xs font-bold text-white">{tools[2]?.name || "N/A"}</p>
                      <p className="text-[10px] text-[#666] mt-1">{tools[2]?.votes} Votes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && tools.length === 0 && (
        <div className="p-12 rounded-lg border border-[#1f1f1f] bg-[#050505] text-center">
          <p className="text-[#666] text-sm">No tools found matching "{keyword}". Try browsing our categories or use the search function.</p>
        </div>
      )}
    </div>
  );
};
