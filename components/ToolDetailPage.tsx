'use client';

import { useState, useEffect } from 'react';
import { Tool, User } from '@/types';
import { ArrowUpRight, ThumbsUp, Heart, Star, Check, X as XIcon, Globe } from 'lucide-react';
import { ToolFAQ } from './ToolFAQ';
import { ToolUseCases } from './ToolUseCases';
import { RelatedTools } from './RelatedTools';
import { Breadcrumbs } from './Breadcrumbs';

interface FAQItem {
  question: string;
  answer: string;
}

interface UseCase {
  title: string;
  description: string;
}

interface Props {
  tool: Tool;
  faqs?: FAQItem[];
  useCases?: UseCase[];
  relatedTools?: Tool[];
}

export function ToolDetailPage({ tool, faqs = [], useCases = [], relatedTools = [] }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [votes, setVotes] = useState(tool.votes);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  
  const categorySlug = tool.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLiked(parsedUser.likedToolIds?.includes(tool.id) || false);
        setIsStarred(parsedUser.starredToolIds?.includes(tool.id) || false);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, [tool.id]);

  const handleAction = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const handleVote = async () => {
    handleAction(async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/tools/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: tool.id, userId: user.id }),
        });
        
        if (response.ok) {
          setVotes(prev => prev + 1);
          setShowLeadModal(true);
        }
      } catch (error) {
        console.error('Error voting:', error);
      }
    });
  };

  const handleLike = async () => {
    handleAction(async () => {
      if (!user) return;
      
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      
      try {
        const response = await fetch('/api/users/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            toolId: tool.id,
            interactionType: 'like',
            action: newIsLiked ? 'add' : 'remove',
          }),
        });
        
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Error updating like:', error);
        setIsLiked(!newIsLiked); // Revert on error
      }
    });
  };

  const handleStar = async () => {
    handleAction(async () => {
      if (!user) return;
      
      const newIsStarred = !isStarred;
      setIsStarred(newIsStarred);
      
      try {
        const response = await fetch('/api/users/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            toolId: tool.id,
            interactionType: 'star',
            action: newIsStarred ? 'add' : 'remove',
          }),
        });
        
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Error updating star:', error);
        setIsStarred(!newIsStarred); // Revert on error
      }
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAuthModal(false);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert('Failed to sign up. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs 
          items={[
            { label: tool.category, href: `/best-ai-for/${categorySlug}` },
            { label: tool.name },
          ]}
        />
        <div className="bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] p-4 sm:p-8 md:p-14">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 mb-8 md:mb-12">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded bg-white text-black flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-black shrink-0"
              role="img"
              aria-label={`${tool.name} logo`}
            >
              {tool.name[0]}
            </div>
            <div className="space-y-2 md:space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase italic">
                  {tool.name}
                </h1>
                <span className="bg-black text-[#666] text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-[#1f1f1f]">
                  {tool.category}
                </span>
              </div>
              <p className="text-base sm:text-lg text-[#888] font-medium leading-relaxed">
                {tool.tagline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16">
            <div className="lg:col-span-7 space-y-6 md:space-y-8 lg:space-y-10">
              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Analysis Engine
                </h2>
                <p className="text-[#aaa] leading-relaxed text-base font-medium italic">
                  "{tool.description}"
                </p>
              </section>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 sm:p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                  <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {tool.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs sm:text-[11px] text-[#666] font-bold flex items-center gap-2 italic"
                      >
                        <Check size={14} className="text-green-500 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 sm:p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                  <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                    Weaknesses
                  </h3>
                  <ul className="space-y-3">
                    {tool.weaknesses.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs sm:text-[11px] text-[#666] font-bold flex items-center gap-2 italic"
                      >
                        <XIcon size={14} className="text-pink-500 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {useCases.length > 0 && (
                <ToolUseCases useCases={useCases} />
              )}

              {faqs.length > 0 && (
                <ToolFAQ faqs={faqs} />
              )}

              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Best For
                </h2>
                <p className="text-[#aaa] text-sm">{tool.bestFor}</p>
              </section>

              {tool.overkillFor && (
                <section className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                    Overkill For
                  </h2>
                  <p className="text-[#aaa] text-sm">{tool.overkillFor}</p>
                </section>
              )}

              {relatedTools.length > 0 && (
                <RelatedTools tools={relatedTools} currentToolId={tool.id} />
              )}

              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Related Pages
                </h2>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/alternative/${tool.id}`}
                    className="px-4 py-2 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-[11px] text-[#888] font-bold hover:text-white hover:border-[#333] transition-all"
                  >
                    View Alternatives
                  </a>
                  <a
                    href={`/best-ai-for/${tool.category.toLowerCase()}`}
                    className="px-4 py-2 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-[11px] text-[#888] font-bold hover:text-white hover:border-[#333] transition-all"
                  >
                    Best for {tool.category}
                  </a>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5 space-y-6 md:space-y-8 lg:space-y-10">
              <div className="flex flex-col gap-3">
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest"
                >
                  Open Resource <ArrowUpRight size={18} />
                </a>
                <button 
                  onClick={handleVote}
                  className="bg-black border border-[#1f1f1f] text-[#888] py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:text-white transition-all uppercase tracking-widest"
                >
                  <ThumbsUp size={16} /> Upvote ({votes.toLocaleString()})
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={handleLike}
                    className={`flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isLiked ? 'text-pink-500 border-pink-500' : 'text-[#444] hover:text-white'
                    }`}
                  >
                    <Heart size={14} fill={isLiked ? "currentColor" : "none"} /> Like
                  </button>
                  <button 
                    onClick={handleStar}
                    className={`flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      isStarred ? 'text-yellow-500 border-yellow-500' : 'text-[#444] hover:text-white'
                    }`}
                  >
                    <Star size={14} fill={isStarred ? "currentColor" : "none"} /> Save
                  </button>
                </div>
              </div>

              <div className="p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#444]">
                  Tool Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Rating</span>
                    <span className="text-white font-bold">{tool.rating}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Pricing</span>
                    <span className="text-white font-bold">{tool.pricing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Votes</span>
                    <span className="text-white font-bold">{votes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Popularity</span>
                    <span className="text-white font-bold">{tool.popularity}</span>
                  </div>
                  {tool.launchDate && (
                    <div className="flex justify-between">
                      <span className="text-[#666]">Launch Date</span>
                      <span className="text-white font-bold">{tool.launchDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Ecosystem Modal */}
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

      {/* Lead Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowLeadModal(false)}></div>
          <div className="relative bg-[#0a0a0a] w-full max-w-sm p-10 rounded-lg border border-[#1f1f1f] space-y-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mx-auto">
              <ThumbsUp size={32} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Upvote.</h3>
              <p className="text-[#666] text-xs font-medium leading-relaxed">Help thousands find the <span className="text-white">Best AI tools 2026</span>.</p>
            </div>
            <button 
              onClick={() => setShowLeadModal(false)}
              className="w-full bg-white text-black py-4 rounded font-bold text-xs uppercase tracking-widest hover:bg-[#eee] transition-all"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

