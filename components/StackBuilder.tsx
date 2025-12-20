
import React, { useState } from 'react';
import { Tool } from '../types';
import { Search, Plus, Trash2, Box, Sparkles, Download, Zap, X } from 'lucide-react';
import { ToolCard } from './ToolCard';

interface Props {
  tools: Tool[];
  onToolClick: (tool: Tool) => void;
  onVote: (tool: Tool) => void;
  onLike: (tool: Tool) => void;
  onStar: (tool: Tool) => void;
}

export const StackBuilder: React.FC<Props> = ({ tools, onToolClick, onVote, onLike, onStar }) => {
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState('');

  const filtered = tools.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  const toggleTool = (tool: Tool) => {
    if (selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 pt-8 max-w-7xl mx-auto items-start">
      {/* RHS on Mobile: Show stack at the top or bottom. Here we stack it normally but use 'order' if needed. */}
      {/* For mobile UX, having the current stack accessible is key. Let's place it at the top for small screens. */}
      <div className="lg:col-span-4 lg:order-2 order-1 sticky top-20 lg:static z-10">
        <div className="bg-[#0a0a0a] p-6 lg:p-8 rounded-lg border border-[#1f1f1f] lg:sticky lg:top-24 max-h-[40vh] lg:max-h-[calc(100vh-140px)] flex flex-col shadow-2xl lg:shadow-none">
          <div className="flex items-center justify-between mb-4 lg:mb-8 pb-4 border-b border-[#1f1f1f]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#eee]">Production Stack</h3>
            <span className="text-[10px] font-bold bg-[#111] border border-[#1f1f1f] text-[#666] px-2 py-0.5 rounded">
              {selectedTools.length} ITEMS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            {selectedTools.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-20 py-4 lg:py-8">
                <Box size={24} lg:size={32} />
                <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-center">Stack Empty</p>
              </div>
            ) : (
              selectedTools.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 lg:p-3 rounded bg-black border border-[#1f1f1f] group hover:border-[#333] transition-all">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-[#111] rounded flex items-center justify-center font-bold text-xs">{t.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#eee] truncate">{t.name}</p>
                    <p className="text-[9px] text-[#444] uppercase font-bold tracking-tighter truncate">{t.category.split(' ')[0]}</p>
                  </div>
                  <button onClick={() => toggleTool(t)} className="p-1.5 text-[#333] hover:text-white transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 lg:mt-8 space-y-4 pt-4 lg:pt-6 border-t border-[#1f1f1f] hidden lg:block">
            <button className="w-full bg-white text-black py-3 rounded font-bold text-xs hover:bg-[#eee] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
              <Download size={14} /> Export Manifest
            </button>
          </div>
        </div>
      </div>

      {/* LHS: Library */}
      <div className="lg:col-span-8 lg:order-1 order-2 space-y-8">
        <div className="bg-[#0a0a0a] p-6 rounded-lg border border-[#1f1f1f] space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Box className="text-white" size={20} />
              AI Tool Builder
            </h2>
            <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest hidden sm:inline">600+ Assets Indexed</span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
            <input 
              type="text" 
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-[#1f1f1f] rounded py-3 pl-12 pr-4 focus:outline-none focus:border-[#333] transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="relative group">
              <ToolCard 
                tool={t} 
                onClick={onToolClick} 
                onVote={onVote} 
                onLike={onLike} 
                onStar={onStar} 
              />
              <button 
                onClick={(e) => { e.stopPropagation(); toggleTool(t); }}
                className={`absolute top-4 right-14 w-8 h-8 rounded border transition-all flex items-center justify-center z-20 ${
                  selectedTools.find(st => st.id === t.id) 
                  ? 'bg-white text-black border-white' 
                  : 'bg-black text-[#666] border-[#1f1f1f] opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                }`}
              >
                {selectedTools.find(st => st.id === t.id) ? <Trash2 size={14} /> : <Plus size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
