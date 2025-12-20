
import React from 'react';
import { Tool } from '../types';
import { ToolCard } from './ToolCard';
import { ArrowLeft } from 'lucide-react';

interface Props {
  keyword: string;
  targetTool?: Tool;
  alternatives: Tool[];
  onBack: () => void;
  onToolClick: (tool: Tool) => void;
  onVote: (tool: Tool) => void;
}

export const SEOSection: React.FC<Props> = ({ keyword, targetTool, alternatives, onBack, onToolClick, onVote }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
        <ArrowLeft size={14} /> Back to Directory
      </button>

      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight leading-tight">
          Best <span className="text-white">{keyword}</span> for 2025
        </h1>
        <p className="text-[#888] text-base leading-relaxed max-w-2xl">
          Don't settle for marketing hype. We audited 600+ AI tools to bring you the top performing {keyword} based on latency, output quality, and cost-efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alternatives.map(tool => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            onClick={onToolClick} 
            onVote={onVote}
            onLike={() => {}} 
            onStar={() => {}} 
          />
        ))}
      </div>

      <div className="p-8 rounded-lg border border-[#1f1f1f] bg-[#050505] space-y-6">
        <h2 className="text-xl font-bold">Why look for alternatives?</h2>
        <p className="text-sm text-[#666] leading-relaxed">
          While {targetTool?.name || "mainstream tools"} are great entry points, power users often require specialized features, local-first data privacy, or more competitive API pricing. Our Ecosystem index helps you find the precise tool for your specific business constraints.
        </p>
        <div className="flex gap-4">
          <div className="flex-1 p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
            <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Top Rated for Speed</h3>
            <p className="text-xs text-[#888]">{alternatives[0]?.name || "Loading..."}</p>
          </div>
          <div className="flex-1 p-4 rounded bg-[#0a0a0a] border border-[#1f1f1f]">
            <h3 className="text-[10px] font-black uppercase text-[#444] mb-2 tracking-widest">Best Value</h3>
            <p className="text-xs text-[#888]">{alternatives[1]?.name || "Loading..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
