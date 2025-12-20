
import React, { useState } from 'react';
import { Category, PromptTemplate } from '../types';
import { Search, Copy, Check, BookOpen, Filter } from 'lucide-react';

interface Props {
  prompts: PromptTemplate[];
}

export const PromptLibrary: React.FC<Props> = ({ prompts }) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<Category | 'All'>('All');

  const filtered = prompts.filter(p => 
    (selectedCat === 'All' || p.category === selectedCat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.prompt.toLowerCase().includes(search.toLowerCase()))
  );

  const copyToClipboard = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pt-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight"><span className="text-white">AI Prompt Template</span> Library</h2>
          <p className="text-[#888] text-sm font-medium">100+ production-ready ChatGPT prompt templates curated by the 10ex community.</p>
        </div>
        <div className="flex items-center gap-2 text-[#444] text-[10px] font-bold uppercase tracking-[0.2em]">
          <BookOpen size={14} /> 120+ Templates Indexed
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-6 rounded-lg border border-[#1f1f1f] space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
          <input 
            type="text" 
            placeholder="Search prompt templates for [task]..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-[#1f1f1f] rounded py-3 pl-12 pr-4 focus:outline-none focus:border-[#333] transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...Object.values(Category).slice(0, 6)].map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCat(cat as any)}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedCat === cat ? 'bg-white text-black border-white' : 'border-[#1f1f1f] text-[#666] hover:text-white'}`}
            >
              {cat === 'All' ? 'All' : cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-[#0a0a0a] p-6 rounded-lg border border-[#1f1f1f] hover:border-[#333] transition-all flex flex-col group">
            <div className="flex items-center justify-between mb-6">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                p.level === 'Pro' ? 'border-yellow-900 text-yellow-500 bg-yellow-500/5' : 'border-[#1f1f1f] text-[#444]'
              }`}>
                {p.level}
              </span>
              <span className="text-[9px] text-[#444] font-bold uppercase tracking-widest">{p.category.split(' ')[0]}</span>
            </div>
            <h3 className="text-sm font-bold mb-4 text-[#eee] group-hover:text-white transition-colors">{p.title}</h3>
            <div className="flex-1 bg-black/50 p-4 rounded border border-[#1a1a1a] font-mono text-[11px] text-[#666] leading-relaxed mb-6 italic line-clamp-4">
               "{p.prompt}"
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              <span className="text-[9px] text-[#333] font-bold uppercase tracking-widest">{p.copyCount.toLocaleString()} Uses</span>
              <button 
                onClick={() => copyToClipboard(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-[10px] tracking-widest transition-all border ${
                  copiedId === p.id 
                  ? 'bg-green-600 text-white border-green-600' 
                  : 'bg-white text-black border-white hover:bg-gray-200'
                }`}
              >
                {copiedId === p.id ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === p.id ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
