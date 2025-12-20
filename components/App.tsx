'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Navigation } from './Navigation';
import { ToolCard } from './ToolCard';
import { ChatInterface } from './ChatInterface';
import { StackBuilder } from './StackBuilder';
import { PromptLibrary } from './PromptLibrary';
import { SEOSection } from './SEOPages';
import { ToolListStructuredData } from './StructuredData';
import { Category, Tool, User } from '@/types';
import { 
  Search, TrendingUp, X, Copy, Rocket, Box, Zap, 
  ThumbsUp, Award, ArrowRight, Flame, ArrowUpRight, Star, Gift, UserPlus, Heart, Globe, ExternalLink, Loader2
} from 'lucide-react';

// Data fetching hooks
const useTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from API first
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        if (data.tools && data.tools.length > 0) {
          setTools(data.tools);
        } else {
          // Fallback to local data if database is empty
          import('@/data/toolsData').then(({ toolsDataset }) => {
            setTools(toolsDataset);
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tools from API, using local data:', err);
        // Fallback to local data on error
        import('@/data/toolsData').then(({ toolsDataset }) => {
          setTools(toolsDataset);
          setLoading(false);
        });
      });
  }, []);

  return { tools, loading };
};

const usePrompts = () => {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from API first
    fetch('/api/prompts')
      .then(res => res.json())
      .then(data => {
        if (data.prompts && data.prompts.length > 0) {
          setPrompts(data.prompts);
        } else {
          // Fallback to local data if database is empty
          import('@/data/toolsData').then(({ promptsDataset }) => {
            setPrompts(promptsDataset);
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching prompts from API, using local data:', err);
        // Fallback to local data on error
        import('@/data/toolsData').then(({ promptsDataset }) => {
          setPrompts(promptsDataset);
          setLoading(false);
        });
      });
  }, []);

  return { prompts, loading };
};

const App: React.FC = () => {
  const { tools: toolsDataset, loading: toolsLoading } = useTools();
  const { prompts: promptsDataset, loading: promptsLoading } = usePrompts();
  
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [fatigueMode, setFatigueMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [heroQuery, setHeroQuery] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showViralModal, setShowViralModal] = useState(false);
  const [showCategorySidebar, setShowCategorySidebar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [seoTarget, setSeoTarget] = useState<{ keyword: string, toolId?: string } | null>(null);
  const [displayedToolsCount, setDisplayedToolsCount] = useState(24);

  // URL Sync for SEO
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const keyword = q.replace(/-/g, ' ');
      setSeoTarget({ keyword });
    }
  }, []);

  useEffect(() => {
    if (seoTarget) {
      const slug = seoTarget.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      window.history.pushState({ seo: true }, '', `?q=${slug}`);
      window.scrollTo(0, 0);
    } else {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('q')) {
        window.history.pushState({}, '', window.location.pathname);
      }
    }
  }, [seoTarget]);

  const trendingNews = [
    { id: 1, title: "Gemini 3 Pro sets new benchmarks in tool reasoning.", source: "AI Insights Daily", time: "2h ago" },
    { id: 2, title: "Why open-source models are winning the 'AI Tool Comparison' wars.", source: "TechCrunch", time: "5h ago" },
    { id: 3, title: "10ex.ai releases new autonomous agent architecture for founders.", source: "Founder Hub", time: "1d ago" },
  ];

  const categories = Object.values(Category);

  // SEO-focused footer links
  const footerSEOLinks = useMemo(() => {
    return {
      toolBox: [
        'Top ChatGPT Alternatives in 2025',
        'Best AI Writing Tools 2025',
        'Free AI Tools for Startups',
        'Best AI Tools Comparison'
      ],
      directory: [
        'AI Design Tools for Creators',
        'Best AI Coding Tools 2025',
        'AI Video Generation Tools',
        'AI Marketing Tools for Business'
      ],
      engine: [
        'AI Research Tools 2025',
        'AI Sales Tools & Outreach',
        'AI Productivity Tools',
        'AI Automation Tools'
      ],
      prompts: [
        'ChatGPT Prompt Templates',
        'SEO Prompt Templates',
        'AI Prompt Library 2025'
      ]
    };
  }, []);

  const filteredTools = useMemo(() => {
    let result = toolsDataset;
    if (selectedCategory !== 'All') result = result.filter(t => t.category === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q));
    }
    if (fatigueMode) {
      return result.sort((a,b) => b.rating - a.rating).slice(0, 12);
    }
    return result.sort((a, b) => b.votes - a.votes);
  }, [searchQuery, selectedCategory, fatigueMode, toolsDataset]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedToolsCount(24);
  }, [searchQuery, selectedCategory, fatigueMode]);

  const displayedTools = useMemo(() => {
    return filteredTools.slice(0, displayedToolsCount);
  }, [filteredTools, displayedToolsCount]);

  const hasMoreTools = displayedToolsCount < filteredTools.length;

  const handleLoadMore = () => {
    setDisplayedToolsCount(prev => prev + 24);
  };

  const trendingTools = useMemo(() => {
    return toolsDataset.sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  }, [toolsDataset]);

  const handleHeroSubmit = () => {
    if (!heroQuery.trim()) return;
    setActiveTab('chat');
  };

  const handleAction = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const handleLike = async (tool: Tool) => {
    handleAction(async () => {
      if (!user) return;
      
      const isLiked = user.likedToolIds.includes(tool.id);
      
      try {
        const response = await fetch('/api/users/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            toolId: tool.id,
            interactionType: 'like',
            action: isLiked ? 'remove' : 'add',
          }),
        });
        
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error updating like:', error);
      }
    });
  };

  const handleStar = async (tool: Tool) => {
    handleAction(async () => {
      if (!user) return;
      
      const isStarred = user.starredToolIds.includes(tool.id);
      
      try {
        const response = await fetch('/api/users/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            toolId: tool.id,
            interactionType: 'star',
            action: isStarred ? 'remove' : 'add',
          }),
        });
        
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error updating star:', error);
      }
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string || 'User';

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setShowAuthModal(false);
        setShowViralModal(true);
      }
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  // Function to filter tools based on SEO keyword
  const getFilteredToolsForSEO = (keyword: string): Tool[] => {
    const lowerKeyword = keyword.toLowerCase();
    let filtered: Tool[] = [];

    // Map SEO keywords to tool filters
    if (lowerKeyword.includes('chatgpt alternative') || lowerKeyword.includes('chatgpt alternatives')) {
      const chatgpt = toolsDataset.find(t => t.id === 'chatgpt' || t.name.toLowerCase().includes('chatgpt'));
      if (chatgpt) {
        filtered = toolsDataset
          .filter(t => t.category === chatgpt.category && t.id !== chatgpt.id)
          .sort((a, b) => b.rating - a.rating);
      } else {
        filtered = toolsDataset.filter(t => t.category === Category.WRITING).sort((a, b) => b.rating - a.rating);
      }
    } else if (lowerKeyword.includes('writing tool') || lowerKeyword.includes('writing tools') || lowerKeyword.includes('content tool')) {
      filtered = toolsDataset.filter(t => t.category === Category.WRITING).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('design tool') || lowerKeyword.includes('design tools') || lowerKeyword.includes('image generator')) {
      filtered = toolsDataset.filter(t => t.category === Category.DESIGN).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('coding tool') || lowerKeyword.includes('coding tools') || lowerKeyword.includes('developer tool')) {
      filtered = toolsDataset.filter(t => t.category === Category.CODING).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('video tool') || lowerKeyword.includes('video tools') || lowerKeyword.includes('video generator')) {
      filtered = toolsDataset.filter(t => t.category === Category.VIDEO).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('marketing tool') || lowerKeyword.includes('marketing tools')) {
      filtered = toolsDataset.filter(t => t.category === Category.MARKETING).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('research tool') || lowerKeyword.includes('research tools') || lowerKeyword.includes('search tool')) {
      filtered = toolsDataset.filter(t => t.category === Category.RESEARCH).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('sales tool') || lowerKeyword.includes('sales tools') || lowerKeyword.includes('outreach tool')) {
      filtered = toolsDataset.filter(t => t.category === Category.SALES).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('productivity tool') || lowerKeyword.includes('productivity tools')) {
      filtered = toolsDataset.filter(t => t.category === Category.PRODUCTIVITY).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('automation tool') || lowerKeyword.includes('automation tools') || lowerKeyword.includes('agent')) {
      filtered = toolsDataset.filter(t => t.category === Category.AUTOMATION).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('data tool') || lowerKeyword.includes('data tools') || lowerKeyword.includes('analytics tool')) {
      filtered = toolsDataset.filter(t => t.category === Category.DATA).sort((a, b) => b.rating - a.rating);
    } else if (lowerKeyword.includes('free tool') || lowerKeyword.includes('free tools')) {
      filtered = toolsDataset.filter(t => t.pricing === 'Free').sort((a, b) => b.rating - a.rating);
    } else {
      filtered = toolsDataset.filter(t => 
        t.name.toLowerCase().includes(lowerKeyword) ||
        t.tagline.toLowerCase().includes(lowerKeyword) ||
        t.category.toLowerCase().includes(lowerKeyword)
      ).sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  const renderContent = () => {
    if (seoTarget) {
      const targetTool = toolsDataset.find(t => t.id === seoTarget.toolId);
      const filteredToolsForSEO = getFilteredToolsForSEO(seoTarget.keyword);
      return (
        <SEOSection 
          keyword={seoTarget.keyword}
          targetTool={targetTool}
          alternatives={filteredToolsForSEO}
          onBack={() => {
            setSeoTarget(null);
            setActiveTab('discover');
          }}
          onToolClick={setSelectedTool}
          onVote={() => handleAction(() => setShowLeadModal(true))}
          onLike={handleLike}
          onStar={handleStar}
        />
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <ChatInterface 
            tools={toolsDataset} 
            initialQuery={heroQuery} 
            onBack={() => {
              setActiveTab('discover');
              setHeroQuery('');
            }}
            onToolClick={setSelectedTool}
            onVote={async () => {
              if (user && selectedTool) {
                try {
                  await fetch('/api/tools/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ toolId: selectedTool.id, userId: user.id }),
                  });
                  setShowLeadModal(true);
                } catch (error) {
                  console.error('Error voting:', error);
                }
              } else {
                setShowAuthModal(true);
              }
            }}
            onInput={() => {
              if (!user) {
                setShowAuthModal(true);
              }
            }}
            onLike={handleLike}
            onStar={handleStar}
            isLiked={(toolId) => user?.likedToolIds.includes(toolId) || false}
            isStarred={(toolId) => user?.starredToolIds.includes(toolId) || false}
          />
        );
      case 'trending':
        return (
          <div className="space-y-16 animate-in fade-in duration-500 max-w-5xl mx-auto pt-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-8 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black flex items-center gap-3"><Flame className="text-orange-500" /> Viral Assets</h2>
                  <p className="text-[#888] text-sm font-medium">Most shared and upvoted AI tool directory listings this week.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingTools.slice(0, 6).map(tool => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool} 
                      isLiked={user?.likedToolIds.includes(tool.id)}
                      isStarred={user?.starredToolIds.includes(tool.id)}
                      onClick={setSelectedTool} 
                      onVote={() => handleAction(() => setShowLeadModal(true))}
                      onLike={handleLike}
                      onStar={handleStar}
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-4 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-black flex items-center gap-3"><TrendingUp size={20} /> News Feed</h2>
                  <p className="text-[#888] text-xs font-medium uppercase tracking-widest">Real-time Space Updates</p>
                </div>
                <div className="space-y-4">
                  {trendingNews.map(item => (
                    <div key={item.id} className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition-all cursor-pointer group">
                      <p className="text-xs font-bold text-[#eee] group-hover:text-white mb-2 leading-relaxed">{item.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#444] font-black uppercase tracking-tighter">{item.source}</span>
                        <span className="text-[10px] text-[#444] font-black uppercase tracking-tighter">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'leaderboards':
        return (
          <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto pt-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black flex items-center gap-3"><Award className="text-yellow-500" /> AI Tool Ranking Site</h2>
              <p className="text-[#888] text-sm font-medium">Best AI tools 2025 based on audited performance metrics.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => (
                <div key={cat} className="bg-[#0a0a0a] p-6 rounded-lg border border-[#1f1f1f]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#444] mb-6">{cat}</h3>
                  <div className="space-y-3">
                    {toolsDataset.filter(t => t.category === cat).sort((a,b) => b.rating - a.rating).slice(0, 5).map((t, i) => (
                      <div key={t.id} className="flex items-center gap-4 p-3 rounded hover:bg-[#111] cursor-pointer group transition-all" onClick={() => setSelectedTool(t)}>
                        <span className="text-[10px] font-black text-[#222] w-4">0{i+1}</span>
                        <p className="text-xs font-bold text-[#666] flex-1 group-hover:text-white">{t.name}</p>
                        <p className="text-[10px] font-black text-electric-blue">{t.rating}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'stack':
        return (
          <StackBuilder 
            tools={toolsDataset} 
            onToolClick={setSelectedTool} 
            onVote={(tool) => handleAction(() => setShowLeadModal(true))}
            onLike={handleLike}
            onStar={handleStar}
          />
        );
      case 'prompts':
        return <PromptLibrary prompts={promptsDataset} />;
      default:
        return (
          <div className={`space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto ${fatigueMode ? 'pt-8' : ''}`}>
            {!fatigueMode && (
              <div className="relative space-y-6 py-12 text-center border-b border-[#1f1f1f]">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                  <span className="gradient-text">Be the First to Discover the AI Tools Shaping 2025</span>
                </h1>
                <p className="text-[#888] text-sm md:text-base max-w-xl mx-auto font-medium">
                  The definitive <span className="text-white">AI tool directory</span> curated for solo-hackers.
                </p>
                <div className="max-w-xl mx-auto relative pt-4">
                  <div className="relative bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-1 flex items-center focus-within:border-[#333] transition-colors">
                    <input 
                      type="text" 
                      placeholder="Search AI tool directory..."
                      className="flex-1 bg-transparent py-2.5 px-4 focus:outline-none text-sm placeholder:text-[#444]"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleHeroSubmit()}
                    />
                    <button onClick={handleHeroSubmit} className="bg-white text-black px-4 py-2 rounded text-xs font-bold hover:bg-[#eee] transition-all flex items-center gap-2">
                      Scan <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded py-2 pl-10 pr-4 focus:outline-none focus:border-[#333] transition-all text-sm"
                  />
                </div>
                {!fatigueMode && (
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
                    {['All', ...categories.slice(0, 5)].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-white text-black' : 'border-[#1f1f1f] text-[#666] hover:text-white'}`}
                      >
                        {cat === 'All' ? 'All' : cat.split(' ')[0]}
                      </button>
                    ))}
                    <button onClick={() => setShowCategorySidebar(true)} className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-electric-blue border border-electric-blue/20 hover:bg-electric-blue/5">
                      All Categories
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedTools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    isLiked={user?.likedToolIds.includes(tool.id)}
                    isStarred={user?.starredToolIds.includes(tool.id)}
                    onClick={setSelectedTool} 
                    onVote={() => handleAction(() => setShowLeadModal(true))}
                    onLike={handleLike}
                    onStar={handleStar}
                  />
                ))}
              </div>
              {hasMoreTools && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    className="bg-[#0a0a0a] border border-[#1f1f1f] text-white px-8 py-3 rounded-lg font-bold text-xs hover:bg-[#111] hover:border-[#333] transition-all uppercase tracking-widest flex items-center gap-2"
                  >
                    Load More Tools
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (toolsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-electric-blue mx-auto mb-4" size={32} />
          <p className="text-[#666] text-sm">Loading tools...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toolsDataset.length > 0 && (
        <ToolListStructuredData
          tools={toolsDataset}
          title="Best AI Tools Directory 2025"
          description="Comprehensive directory of 600+ AI tools including ChatGPT alternatives, writing tools, design tools, and more."
        />
      )}
      <div className="min-h-screen pt-20 pb-16 px-4">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={(t) => { 
          setActiveTab(t); 
          setSeoTarget(null);
          setSearchQuery('');
          setSelectedCategory('All');
          setDisplayedToolsCount(24);
        }} 
        fatigueMode={fatigueMode} 
        setFatigueMode={setFatigueMode} 
        onOpenCategories={() => setShowCategorySidebar(true)}
      />

      {showCategorySidebar && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[800]" onClick={() => setShowCategorySidebar(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-full max-w-xs bg-[#0a0a0a] border-r border-[#1f1f1f] z-[900] p-8 animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Categories</h3>
              <button onClick={() => setShowCategorySidebar(false)} className="text-[#444] hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => { setSelectedCategory('All'); setShowCategorySidebar(false); }}
                className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${selectedCategory === 'All' ? 'bg-[#1f1f1f] text-white' : 'text-[#666] hover:text-white'}`}
              >
                Global Index
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setShowCategorySidebar(false); setActiveTab('discover'); }}
                  className={`w-full text-left px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${selectedCategory === cat ? 'bg-[#1f1f1f] text-white' : 'text-[#666] hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {user && (
        <div className="container mx-auto mb-8 animate-in slide-in-from-top-4">
          <div className="bg-[#0a0a0a] p-3 rounded-lg border border-electric-blue/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-electric-blue uppercase tracking-widest">Builder Status</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-electric-blue/5 border border-electric-blue/20 text-[10px] font-bold text-electric-blue">
                <Gift size={10} /> {user.points} Points
              </div>
            </div>
            <button 
              onClick={() => setShowViralModal(true)}
              className="flex items-center gap-2 text-[10px] font-bold text-white hover:text-electric-blue transition-colors uppercase tracking-widest"
            >
              <UserPlus size={14} /> Referral Reward
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto">
        {renderContent()}
      </main>

      <footer className="mt-24 border-t border-[#1f1f1f] pt-16 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eee]">AI Tool Box</h4>
            <div className="flex flex-col gap-3">
              {footerSEOLinks.toolBox.map(link => (
                <button 
                  key={link} 
                  onClick={() => {
                    setSeoTarget({ keyword: link });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="text-[11px] text-[#444] hover:text-white text-left transition-colors font-medium"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eee]">Directory</h4>
            <div className="flex flex-col gap-3">
              {footerSEOLinks.directory.map(link => (
                <button 
                  key={link} 
                  onClick={() => {
                    setSeoTarget({ keyword: link });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="text-[11px] text-[#444] hover:text-white text-left transition-colors font-medium"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eee]">Engine</h4>
            <div className="flex flex-col gap-3">
              {footerSEOLinks.engine.map(link => (
                <button 
                  key={link} 
                  onClick={() => {
                    setSeoTarget({ keyword: link });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="text-[11px] text-[#444] hover:text-white text-left transition-colors font-medium"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eee]">Prompts</h4>
            <div className="flex flex-col gap-3">
              {footerSEOLinks.prompts.map(link => (
                <button 
                  key={link} 
                  onClick={() => {
                    if (link.includes('Prompt')) {
                      setActiveTab('prompts');
                    } else {
                      setSeoTarget({ keyword: link });
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  className="text-[11px] text-[#444] hover:text-white text-left transition-colors font-medium"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-px bg-[#1f1f1f] w-full mb-8" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white text-black rounded flex items-center justify-center font-black">Z</div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#222]">AI Tool Box &copy; 2024 • 10EX.AI POWERED</span>
          </div>
          <div className="flex gap-8">
            <button 
              onClick={() => {
                alert('Privacy Policy: We respect your privacy. Your data is secure and never shared with third parties.');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => {
                alert('Terms of Service: By using this platform, you agree to our terms. Use tools responsibly and respect intellectual property.');
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-[#444] hover:text-[#888] transition-colors"
            >
              Terms
            </button>
            <a href="https://10ex.ai" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-[#444] hover:text-[#888] flex items-center gap-1 transition-colors">10ex Labs <ExternalLink size={10} /></a>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setShowAuthModal(false)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-sm p-10 rounded-lg border border-[#1f1f1f] space-y-10 shadow-2xl">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-black">Access Ecosystem.</h3>
              <p className="text-[#666] text-xs font-medium leading-relaxed">Join 50k+ practitioners. Unlock advanced comparison logic and upvotes.</p>
            </div>
            <div className="space-y-4">
              <button onClick={handleSignup} className="w-full bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest">
                <Globe size={18} /> Continue with Google
              </button>
              <div className="flex items-center gap-4 py-2 opacity-20">
                <div className="h-px bg-white flex-1"></div>
                <span className="text-[10px] text-white font-black">OR</span>
                <div className="h-px bg-white flex-1"></div>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <input required type="text" name="name" placeholder="Name" className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium" />
                <input required type="email" name="email" placeholder="Email address" className="w-full bg-black border border-[#1f1f1f] rounded py-3.5 px-4 focus:outline-none focus:border-[#333] text-sm font-medium" />
                <button type="submit" className="w-full bg-[#111] border border-[#1f1f1f] text-white py-4 rounded font-bold text-xs hover:bg-[#1a1a1a] transition-all uppercase tracking-widest">
                  Sign Up
                </button>
              </form>
            </div>
            <p className="text-[9px] text-center text-[#333] uppercase tracking-[0.2em] font-black">Secure protocol enabled • powered by 10ex</p>
          </div>
        </div>
      )}

      {showViralModal && user && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setShowViralModal(false)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-md p-12 rounded-lg border border-electric-blue/30 space-y-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-electric-blue/5 rounded-full flex items-center justify-center mx-auto text-electric-blue border border-electric-blue/20">
              <Rocket size={40} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">viral multiplier.</h3>
              <p className="text-[#888] text-sm leading-relaxed">Refer 2 friends to unlock the <span className="text-white">Pro Prompt Hub</span> and <span className="text-white">Exclusive Comparison Stats</span>.</p>
            </div>
            <div className="p-5 rounded border border-dashed border-[#1f1f1f] bg-black space-y-4">
              <p className="text-[10px] text-[#444] uppercase font-bold tracking-[0.3em]">Share Your Link</p>
              <div className="flex gap-2">
                <input readOnly value={`tools.10ex.ai/join?ref=${user.referralCode}`} className="flex-1 bg-black border border-[#1f1f1f] rounded py-2.5 px-3 text-xs text-white focus:outline-none font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(`tools.10ex.ai/join?ref=${user.referralCode}`); alert('Link copied!'); }} className="bg-white text-black p-2.5 rounded hover:bg-[#eee] transition-all"><Copy size={16} /></button>
              </div>
            </div>
            <button onClick={() => setShowViralModal(false)} className="text-[10px] text-[#222] uppercase tracking-[0.2em] font-black hover:text-[#444] transition-colors underline">I'll share later</button>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90" onClick={() => setShowLeadModal(false)}></div>
           <div className="relative bg-[#0a0a0a] w-full max-w-sm p-10 rounded-lg border border-[#1f1f1f] space-y-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto">
                <ThumbsUp size={32} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Upvote.</h3>
                <p className="text-[#666] text-xs font-medium leading-relaxed">Help thousands find the <span className="text-white">Best AI tools 2025</span>.</p>
              </div>
              <button 
                onClick={async () => { 
                  setShowLeadModal(false);
                  if (user && selectedTool) {
                    try {
                      await fetch('/api/tools/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolId: selectedTool.id, userId: user.id }),
                      });
                      const userResponse = await fetch(`/api/users?id=${user.id}`);
                      const userData = await userResponse.json();
                      if (userData.user) {
                        setUser(userData.user);
                      }
                    } catch (error) {
                      console.error('Error voting:', error);
                    }
                  }
                }}
                className="w-full bg-white text-black py-4 rounded font-bold text-xs uppercase tracking-widest hover:bg-[#eee] transition-all"
              >
                Confirm Vote +5 Pts
              </button>
           </div>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setSelectedTool(null)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#1f1f1f] p-8 md:p-14 animate-in zoom-in-95 duration-200 scrollbar-hide shadow-[0_0_100px_rgba(0,0,0,1)]">
            <button onClick={() => setSelectedTool(null)} className="absolute top-8 right-8 p-2 hover:bg-[#111] rounded transition-colors text-[#444] hover:text-white"><X size={24} /></button>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12">
              <div className="w-24 h-24 rounded bg-white text-black flex items-center justify-center text-4xl font-black shrink-0">{selectedTool.name[0]}</div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-4xl font-black tracking-tight uppercase italic">{selectedTool.name}</h2>
                  <span className="bg-black text-[#666] text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-[#1f1f1f]">{selectedTool.category}</span>
                </div>
                <p className="text-lg text-[#888] font-medium leading-relaxed">{selectedTool.tagline}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7 space-y-10">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">Analysis Engine</h3>
                  <p className="text-[#aaa] leading-relaxed text-base font-medium italic">"{selectedTool.description}"</p>
                </section>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                    <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest">Strengths</h4>
                    <ul className="space-y-3">
                      {selectedTool.strengths.map((s, i) => (
                        <li key={i} className="text-[11px] text-[#666] font-bold flex items-center gap-2 italic"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                    <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Risks</h4>
                    <ul className="space-y-3">
                      {selectedTool.weaknesses.map((s, i) => (
                        <li key={i} className="text-[11px] text-[#666] font-bold flex items-center gap-2 italic"><div className="w-1.5 h-1.5 rounded-full bg-pink-500" /> {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 space-y-10">
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleAction(() => window.open(selectedTool.websiteUrl, '_blank'))}
                    className="bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest"
                  >
                    Open Resource <ArrowUpRight size={18} />
                  </button>
                  <button onClick={() => handleAction(() => setShowLeadModal(true))} className="bg-black border border-[#1f1f1f] text-[#888] py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:text-white transition-all uppercase tracking-widest">
                    <ThumbsUp size={16} /> Upvote
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleLike(selectedTool)} className={`flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${user?.likedToolIds.includes(selectedTool.id) ? 'text-pink-500 border-pink-500/20 bg-pink-500/5' : 'text-[#444] hover:text-white'}`}>
                      <Heart size={14} fill={user?.likedToolIds.includes(selectedTool.id) ? "currentColor" : "none"} /> {user?.likedToolIds.includes(selectedTool.id) ? 'Liked' : 'Like'}
                    </button>
                    <button onClick={() => handleStar(selectedTool)} className={`flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${user?.starredToolIds.includes(selectedTool.id) ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' : 'text-[#444] hover:text-white'}`}>
                      <Star size={14} fill={user?.starredToolIds.includes(selectedTool.id) ? "currentColor" : "none"} /> {user?.starredToolIds.includes(selectedTool.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default App;

