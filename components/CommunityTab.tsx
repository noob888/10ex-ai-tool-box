
import React, { useState } from 'react';
import { User, ThumbsUp, MessageSquare, Share2, Plus, Zap, Filter } from 'lucide-react';
import { CommunityInsight, Workflow, Tool } from '../types';

interface Props {
  insights: CommunityInsight[];
  workflows: Workflow[];
  tools: Tool[];
  onAuthRequired: () => void;
}

export const CommunityTab: React.FC<Props> = ({ insights, workflows, tools, onAuthRequired }) => {
  const [activeSubTab, setActiveSubTab] = useState<'insights' | 'workflows'>('insights');

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1f1f1f] pb-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Ecosystem <span className="text-white">Review Feed</span></h2>
          <p className="text-[#888] text-sm font-medium">Real-world AI tool review site insights from 50,000+ practitioners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded">
            <button 
              onClick={() => setActiveSubTab('insights')}
              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubTab === 'insights' ? 'bg-[#1f1f1f] text-white' : 'text-[#666] hover:text-white'}`}
            >
              Insights
            </button>
            <button 
              onClick={() => setActiveSubTab('workflows')}
              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${activeSubTab === 'workflows' ? 'bg-[#1f1f1f] text-white' : 'text-[#666] hover:text-white'}`}
            >
              Workflows
            </button>
          </div>
          <button 
            onClick={onAuthRequired}
            className="bg-white text-black px-4 py-2.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Submit Post
          </button>
        </div>
      </div>

      {activeSubTab === 'insights' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map(insight => {
            const tool = tools.find(t => t.id === insight.toolId);
            return (
              <div key={insight.id} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:border-[#333] transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#111] border border-[#1f1f1f] flex items-center justify-center font-bold text-[10px]">
                      {insight.userName[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#eee]">{insight.userName}</p>
                      <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest">{new Date(insight.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {tool && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#111] border border-[#1f1f1f]">
                      <span className="text-[10px] font-bold text-[#666]">{tool.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#888] leading-relaxed italic">"{insight.content}"</p>
                <div className="flex items-center gap-6 pt-4 border-t border-[#1a1a1a]">
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] hover:text-[#888] transition-colors">
                    <ThumbsUp size={12} /> {insight.upvotes}
                  </button>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] hover:text-[#888] transition-colors">
                    <MessageSquare size={12} /> Reply
                  </button>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-[#444] hover:text-[#888] transition-colors ml-auto">
                    <Share2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="p-6 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] group hover:border-[#333] transition-all cursor-pointer flex flex-col h-full">
              <h3 className="text-sm font-bold mb-2 text-[#eee] group-hover:text-white transition-colors">{wf.title}</h3>
              <p className="text-[11px] text-[#666] mb-6 line-clamp-3 leading-relaxed">{wf.description}</p>
              <div className="mt-auto pt-6 border-t border-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-4">
                  {wf.toolIds.slice(0, 3).map(tid => {
                    const t = tools.find(x => x.id === tid);
                    return t ? (
                      <div key={tid} className="w-6 h-6 bg-[#111] border border-[#1f1f1f] rounded flex items-center justify-center text-[9px] font-black">
                        {t.name[0]}
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">By {wf.userName}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#666]">
                    <ThumbsUp size={10} /> {wf.upvotes}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
