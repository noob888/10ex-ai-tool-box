'use client';

import { Tool } from '@/types';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  tools: Tool[];
  currentToolId: string;
}

export function RelatedTools({ tools, currentToolId }: Props) {
  // Filter out current tool
  const relatedTools = tools.filter(t => t.id !== currentToolId).slice(0, 8);

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
        Related Tools
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {relatedTools.map((tool) => (
          <a
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="p-4 rounded border border-[#1f1f1f] bg-black hover:bg-[#0a0a0a] transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white group-hover:text-[#888] transition-colors truncate">
                  {tool.name}
                </h3>
                <p className="text-xs text-[#666] mt-1 line-clamp-2">
                  {tool.tagline}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-[#666] font-bold">
                    {tool.rating}%
                  </span>
                  <span className="text-[10px] text-[#666]">•</span>
                  <span className="text-[10px] text-[#666] font-bold">
                    {tool.pricing}
                  </span>
                </div>
              </div>
              <ArrowUpRight 
                size={16} 
                className="text-[#666] group-hover:text-white transition-colors shrink-0" 
              />
            </div>
          </a>
        ))}
      </div>
      {relatedTools.length >= 8 && (
        <a
          href={`/best-ai-for/${relatedTools[0]?.category.toLowerCase()}`}
          className="block text-center px-4 py-2 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-[11px] text-[#888] font-bold hover:text-white hover:border-[#333] transition-all"
        >
          View All {relatedTools[0]?.category} Tools
        </a>
      )}
    </section>
  );
}
