'use client';

import React from 'react';
import { Tool } from '../types';
import { Star, Zap, ThumbsUp, Heart, ArrowUpRight } from 'lucide-react';

interface Props {
  tool: Tool;
  isLiked?: boolean;
  isStarred?: boolean;
  onClick: (tool: Tool) => void;
  onVote: (tool: Tool) => void;
  onLike: (tool: Tool) => void;
  onStar: (tool: Tool) => void;
}

export const ToolCard: React.FC<Props> = ({ tool, isLiked, isStarred, onClick, onVote, onLike, onStar }) => {
  return (
    <div 
      onClick={() => onClick(tool)}
      className="group glass p-4 rounded-lg cursor-pointer card-hover border border-[#1f1f1f] flex flex-col h-full bg-[#0a0a0a]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#1f1f1f] flex items-center justify-center text-sm font-bold border border-[#222] group-hover:border-[#333]">
            {tool.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#eee] group-hover:text-white transition-colors">{tool.name}</h3>
            <span className="text-[9px] font-bold text-[#666] uppercase tracking-tighter">{tool.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(tool); }}
            className={`p-1.5 rounded hover:bg-[#111] transition-all ${isLiked ? 'text-pink-500' : 'text-[#444] hover:text-[#888]'}`}
          >
            <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onStar(tool); }}
            className={`p-1.5 rounded hover:bg-[#111] transition-all ${isStarred ? 'text-yellow-500' : 'text-[#444] hover:text-[#888]'}`}
          >
            <Star size={14} fill={isStarred ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <p className="text-xs text-[#888] font-medium line-clamp-2 leading-relaxed mb-4 flex-1">
        {tool.tagline}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[#1a1a1a] mt-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onVote(tool); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#111] border border-[#1f1f1f] hover:border-[#333] transition-all text-[10px] text-[#666] hover:text-[#aaa] font-bold"
          >
            <ThumbsUp size={10} />
            {tool.votes.toLocaleString()}
          </button>
          <div className="flex items-center gap-1 text-[#444]">
            <Zap size={10} className="text-electric-blue" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tool.pricing}</span>
          </div>
        </div>
        <ArrowUpRight size={14} className="text-[#444] group-hover:text-[#888] transition-colors" />
      </div>
    </div>
  );
};
