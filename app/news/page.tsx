'use client';

import React, { useState, useEffect } from 'react';
import { NewsCard, NewsArticle } from '@/components/NewsCard';
import { Loader2, Newspaper, TrendingUp, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    fetch('/api/news?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          const articles = data.articles.map((article: any) => ({
            ...article,
            publishedAt: new Date(article.publishedAt),
            fetchedAt: new Date(article.fetchedAt),
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt),
          }));
          setNews(articles);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching news:', err);
        setLoading(false);
      });
  }, []);

  const filteredNews = filter === 'featured' 
    ? news.filter(article => article.isFeatured)
    : news;

  const featuredNews = news.filter(article => article.isFeatured);
  const regularNews = news.filter(article => !article.isFeatured);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="space-y-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>
          
          <div className="flex items-center gap-3">
            <Newspaper size={32} className="text-electric-blue" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              AI News
            </h1>
          </div>
          <p className="text-[#888] text-base max-w-2xl">
            Stay updated with the latest developments in artificial intelligence, AI tools, and machine learning breakthroughs.
          </p>

          {/* Filter Tabs */}
          <div className="flex items-center gap-4 border-b border-[#1f1f1f]">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-2 text-sm font-bold transition-colors ${
                filter === 'all'
                  ? 'text-white border-b-2 border-electric-blue'
                  : 'text-[#666] hover:text-white'
              }`}
            >
              All News ({news.length})
            </button>
            <button
              onClick={() => setFilter('featured')}
              className={`pb-3 px-2 text-sm font-bold transition-colors ${
                filter === 'featured'
                  ? 'text-white border-b-2 border-electric-blue'
                  : 'text-[#666] hover:text-white'
              }`}
            >
              Featured ({featuredNews.length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="animate-spin text-electric-blue mx-auto mb-4" size={32} />
            <p className="text-[#666] text-sm">Loading news...</p>
          </div>
        )}

        {/* News Content */}
        {!loading && (
          <>
            {/* Featured News Section */}
            {filter === 'all' && featuredNews.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-electric-blue" />
                  <h2 className="text-2xl font-black">Featured Stories</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredNews.map((article: NewsArticle) => (
                    <NewsCard key={article.id} article={article} variant="featured" />
                  ))}
                </div>
              </div>
            )}

            {/* All News / Regular News */}
            {filter === 'all' && regularNews.length > 0 && (
              <div className="space-y-4">
                {featuredNews.length > 0 && (
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    <Newspaper size={20} />
                    Latest Updates
                  </h2>
                )}
                <div className="space-y-3">
                  {regularNews.map((article: NewsArticle) => (
                    <NewsCard key={article.id} article={article} variant="row" />
                  ))}
                </div>
              </div>
            )}

            {/* Filtered News (Featured Only) */}
            {filter === 'featured' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredNews.map((article: NewsArticle) => (
                  <NewsCard key={article.id} article={article} variant="featured" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredNews.length === 0 && !loading && (
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-12 text-center">
                <Newspaper size={48} className="text-[#333] mx-auto mb-4" />
                <p className="text-[#666] text-base mb-2">No news articles found.</p>
                <p className="text-[#444] text-sm">News will be automatically fetched daily. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
