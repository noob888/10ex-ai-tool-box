'use client';

import React, { useState } from 'react';
import { Box, Zap, LayoutGrid, Award, MessageSquare, BookOpen, ShieldCheck, Menu, X, Flame, Newspaper } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fatigueMode: boolean;
  setFatigueMode: (v: boolean) => void;
  onOpenCategories: () => void;
}

export const Navigation: React.FC<Props> = ({ activeTab, setActiveTab, fatigueMode, setFatigueMode, onOpenCategories }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const tabs = [
    { id: 'discover', label: 'Explore', icon: LayoutGrid },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'chat', label: 'Assistant', icon: MessageSquare },
    { id: 'leaderboards', label: 'Rankings', icon: Award },
    { id: 'stack', label: 'Stack Builder', icon: Box },
    { id: 'prompts', label: 'Library', icon: BookOpen },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[500] bg-black border-b border-[#1f1f1f] px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleTabClick('discover')}>
          <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center group-hover:bg-[#f0f0f0] transition-colors">
            <Zap className="fill-black" size={18} />
          </div>
          <h1 className="font-bold text-sm tracking-tight uppercase">AI Tool Box</h1>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === tab.id 
                ? 'bg-[#1f1f1f] text-white' 
                : 'text-[#888] hover:text-white hover:bg-[#111]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/news')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-[#1f1f1f] transition-all text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-white hover:bg-[#111]"
        >
          <Newspaper size={12} />
          News
        </button>
        
        <button 
          onClick={() => setFatigueMode(!fatigueMode)}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-[#1f1f1f] transition-all text-[10px] font-bold uppercase tracking-widest ${
            fatigueMode 
            ? 'bg-white text-black border-white' 
            : 'text-[#888] hover:text-white hover:bg-[#111]'
          }`}
        >
          <ShieldCheck size={12} />
          {fatigueMode ? 'Focus' : 'Browse'}
        </button>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-1.5 rounded border border-[#1f1f1f] text-[#888] hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-black border-b border-[#1f1f1f] lg:hidden animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col p-4 gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all w-full text-left ${
                    activeTab === tab.id 
                    ? 'bg-[#1f1f1f] text-white' 
                    : 'text-[#888] hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                router.push('/news');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all w-full text-left text-[#888] hover:text-white"
            >
              <Newspaper size={16} />
              News
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
