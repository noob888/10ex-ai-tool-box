
import React, { useState, useMemo } from 'react';
import { Tool } from '../types';
import { ToolCard } from './ToolCard';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  keyword: string;
  targetTool?: Tool;
  alternatives: Tool[];
  onBack: () => void;
  onToolClick: (tool: Tool) => void;
  onVote: (tool: Tool) => void;
  onLike?: (tool: Tool) => void;
  onStar?: (tool: Tool) => void;
}

export const SEOSection: React.FC<Props> = ({ keyword, targetTool, alternatives, onBack, onToolClick, onVote, onLike, onStar }) => {
  const [displayedCount, setDisplayedCount] = useState(24);

  const displayedTools = useMemo(() => {
    return alternatives.slice(0, displayedCount);
  }, [alternatives, displayedCount]);

  const hasMoreTools = displayedCount < alternatives.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 24);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pt-8">
      <button onClick={onBack} className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
        <ArrowLeft size={14} /> Back to Directory
      </button>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
          Best <span className="text-white">{keyword}</span> for 2025
        </h1>
        <p className="text-[#888] text-base leading-relaxed max-w-3xl">
          Don't settle for marketing hype. We audited 600+ AI tools to bring you the top performing {keyword.toLowerCase()} based on latency, output quality, and cost-efficiency.
        </p>
        <div className="flex items-center gap-4 text-[10px] font-bold text-[#444] uppercase tracking-widest">
          <span>{alternatives.length} Tools Found</span>
          <span className="text-[#222]">•</span>
          <span>Sorted by Rating</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedTools.map(tool => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            onClick={onToolClick} 
            onVote={onVote}
            onLike={onLike || (() => {})} 
            onStar={onStar || (() => {})} 
            isLiked={false}
            isStarred={false}
          />
        ))}
      </div>

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

      {alternatives.length > 0 && (
        <div className="p-8 rounded-lg border border-[#1f1f1f] bg-[#050505] space-y-6">
          <h2 className="text-xl font-bold">Why choose the right {keyword.toLowerCase()}?</h2>
          <p className="text-sm text-[#666] leading-relaxed">
            Finding the perfect {keyword.toLowerCase()} can make or break your workflow. We've analyzed 600+ tools to help you find the best match based on performance, pricing, and features. Our curated list ensures you get tools that actually deliver results.
          </p>
          {alternatives.length >= 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Top Rated</h3>
                <p className="text-xs font-bold text-white">{alternatives[0]?.name || "N/A"}</p>
                <p className="text-[10px] text-[#666] mt-1">{alternatives[0]?.rating}% Rating</p>
              </div>
              <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Best Value</h3>
                <p className="text-xs font-bold text-white">{alternatives[1]?.name || "N/A"}</p>
                <p className="text-[10px] text-[#666] mt-1">{alternatives[1]?.pricing} Pricing</p>
              </div>
              {alternatives[2] && (
                <div className="p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
                  <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Most Popular</h3>
                  <p className="text-xs font-bold text-white">{alternatives[2]?.name || "N/A"}</p>
                  <p className="text-[10px] text-[#666] mt-1">{alternatives[2]?.votes} Votes</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {alternatives.length === 0 && (
        <div className="p-12 rounded-lg border border-[#1f1f1f] bg-[#050505] text-center">
          <p className="text-[#666] text-sm">No tools found matching "{keyword}". Try browsing our categories or use the search function.</p>
        </div>
      )}
    </div>
  );
};
