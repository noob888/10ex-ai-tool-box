'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Gift, TrendingUp, Code, PenTool, Palette, Megaphone, Briefcase, Search, Video, Settings, Loader2 } from 'lucide-react';
import { useLoading } from './LoadingProvider';

interface CategoryLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: string;
}

const popularCategories: CategoryLink[] = [
  { label: 'Free AI Tools', href: '/free-ai-tools', icon: Gift, color: 'text-green-500' },
  { label: 'New AI Tools', href: '/new-ai-tools', icon: Sparkles, color: 'text-yellow-500' },
  { label: 'Best for Writing', href: '/best-ai-for/writing', icon: PenTool, color: 'text-blue-500' },
  { label: 'Best for Coding', href: '/best-ai-for/coding', icon: Code, color: 'text-purple-500' },
  { label: 'Best for Design', href: '/best-ai-for/design', icon: Palette, color: 'text-pink-500' },
  { label: 'Best for Marketing', href: '/best-ai-for/marketing', icon: Megaphone, color: 'text-orange-500' },
  { label: 'Best for Productivity', href: '/best-ai-for/productivity', icon: Briefcase, color: 'text-cyan-500' },
  { label: 'Best for Research', href: '/best-ai-for/research', icon: Search, color: 'text-indigo-500' },
  { label: 'Best for Video', href: '/best-ai-for/video', icon: Video, color: 'text-red-500' },
  { label: 'Best for Sales', href: '/best-ai-for/sales', icon: TrendingUp, color: 'text-emerald-500' },
  { label: 'Best for Automation', href: '/best-ai-for/automation', icon: Settings, color: 'text-violet-500' },
];

export const CategoryNavigation: React.FC = () => {
  const router = useRouter();
  const { isLoading, setLoading, setLoadingMessage } = useLoading();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage(`Loading ${label}...`);
    router.push(href);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#888]">Browse by Category</h3>
          <p className="text-[10px] text-[#444] font-medium uppercase tracking-widest">Discover AI Tools</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {popularCategories.map((category) => {
          const Icon = category.icon;
          return (
            <a
              key={category.href}
              href={category.href}
              onClick={(e) => handleClick(e, category.href, category.label)}
              className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] hover:border-[#333] transition-all cursor-pointer"
            >
              <Icon 
                size={14} 
                className={`${category.color || 'text-[#666]'} group-hover:scale-110 transition-transform`}
                aria-label={`${category.label} icon`}
              />
              <span className="text-[10px] font-bold text-[#888] group-hover:text-white transition-colors uppercase tracking-tight leading-tight">
                {category.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
