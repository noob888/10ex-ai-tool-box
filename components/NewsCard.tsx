'use client';

import React from 'react';
import { ExternalLink, Calendar, User, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  author: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  category: string;
  tags: string[];
  viewCount: number;
  isFeatured: boolean;
}

interface NewsCardProps {
  article: NewsArticle;
  onClick?: (article: NewsArticle) => void;
  variant?: 'default' | 'featured' | 'compact' | 'row';
}

export const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  onClick,
  variant = 'default'
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 hover:border-[#333] hover:bg-[#111] transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-3">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-16 h-16 object-cover rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white line-clamp-2 group-hover:text-electric-blue transition-colors">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#666]">
              <span>{article.source}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg overflow-hidden hover:border-[#333] hover:bg-[#111] transition-all cursor-pointer group"
      >
        {article.imageUrl && (
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] font-bold text-white">
              Featured
            </div>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-[#666]">
            <TrendingUp size={12} />
            <span className="font-bold uppercase tracking-widest">{article.source}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
          <h3 className="text-base font-black text-white mb-2 line-clamp-2 group-hover:text-electric-blue transition-colors">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-xs text-[#888] line-clamp-2 mb-3">
              {article.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-[#444]">
              <ExternalLink size={10} />
              <span>Read more</span>
            </div>
            {article.tags.length > 0 && (
              <div className="flex gap-1">
                {article.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-[#1a1a1a] text-[10px] text-[#666] rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        onClick={handleClick}
        className="bg-[#111] border-l-4 border-l-electric-blue border-r-[#333] border-t-[#333] border-b-[#333] hover:bg-[#0a0a0a] transition-all cursor-pointer group"
      >
        <div className="p-4 flex items-start gap-4">
          {article.imageUrl && (
            <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 text-[10px] text-[#666]">
              {article.isFeatured && (
                <>
                  <TrendingUp size={12} className="text-electric-blue" />
                  <span className="text-electric-blue font-bold">FEATURED</span>
                  <span>•</span>
                </>
              )}
              <span className="font-bold uppercase tracking-widest">{article.source}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
            <h3 className="text-base font-black text-white mb-2 line-clamp-2 group-hover:text-electric-blue transition-colors">
              {article.title}
            </h3>
            {article.description && (
              <p className="text-sm text-[#888] line-clamp-2 mb-3">
                {article.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {article.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {article.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] text-[#888] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#444] group-hover:text-electric-blue transition-colors">
                <ExternalLink size={12} />
                <span>Read</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg overflow-hidden hover:border-[#333] hover:bg-[#111] transition-all cursor-pointer group"
    >
      {article.imageUrl && (
        <div className="relative w-full h-40 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 text-[10px] text-[#666]">
          <span className="font-bold uppercase tracking-widest">{article.source}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 group-hover:text-electric-blue transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-[#888] line-clamp-2 mb-3">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[#444]">
            <ExternalLink size={10} />
            <span>Read</span>
          </div>
          {article.viewCount > 0 && (
            <span className="text-[10px] text-[#666]">{article.viewCount} views</span>
          )}
        </div>
      </div>
    </div>
  );
};

