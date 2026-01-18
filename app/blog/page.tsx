'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, ArrowRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

// Blog post interface (matches SEOPage structure)
interface BlogPost {
  id: string;
  slug: string;
  keyword: string;
  title: string;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastGeneratedAt: Date | string | null;
  seoScore: number;
}

export default function BlogListPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (data.blogs && data.blogs.length > 0) {
          // Convert date strings to Date objects
          const blogsWithDates = data.blogs.map((blog: any) => ({
            ...blog,
            createdAt: new Date(blog.createdAt),
            updatedAt: new Date(blog.updatedAt),
            lastGeneratedAt: blog.lastGeneratedAt ? new Date(blog.lastGeneratedAt) : null,
          }));
          setBlogs(blogsWithDates);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching blogs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-electric-blue" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              AI Tools Blog
            </h1>
          </div>
          <p className="text-[#888] text-base max-w-2xl">
            Comprehensive guides, comparisons, and insights about AI tools, productivity, and automation.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="animate-spin text-electric-blue mx-auto mb-4" size={32} />
            <p className="text-[#666] text-sm">Loading blogs...</p>
          </div>
        )}

        {/* Blog List */}
        {!loading && (
          <>
            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => router.push(`/blog/${blog.slug}`)}
                    className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg overflow-hidden hover:border-[#333] hover:bg-[#111] transition-all cursor-pointer group"
                  >
                    {blog.featuredImageUrl && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <img
                          src={blog.featuredImageUrl}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 text-[10px] text-[#666]">
                        <Calendar size={12} />
                        <span>
                          {blog.lastGeneratedAt 
                            ? formatDistanceToNow(new Date(blog.lastGeneratedAt), { addSuffix: true })
                            : formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })
                          }
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white mb-2 line-clamp-2 group-hover:text-electric-blue transition-colors">
                        {blog.title}
                      </h2>
                      {blog.metaDescription && (
                        <p className="text-xs text-[#888] line-clamp-3 mb-4">
                          {blog.metaDescription}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-[#444]">
                          <ArrowRight size={10} />
                          <span>Read more</span>
                        </div>
                        {blog.seoScore > 0 && (
                          <span className="text-[10px] text-[#666]">
                            Score: {blog.seoScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-12 text-center">
                <BookOpen size={48} className="text-[#333] mx-auto mb-4" />
                <p className="text-[#666] text-base mb-2">No blog posts yet.</p>
                <p className="text-[#444] text-sm">Blog posts will be automatically generated. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
