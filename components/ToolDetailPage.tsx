'use client';

import { Tool } from '@/types';
import { X, ArrowUpRight, ThumbsUp, Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface Props {
  tool: Tool;
}

export function ToolDetailPage({ tool }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0a0a0a] rounded-lg border border-[#1f1f1f] p-8 md:p-14">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-12">
            <div className="w-24 h-24 rounded bg-white text-black flex items-center justify-center text-4xl font-black shrink-0">
              {tool.name[0]}
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-4xl font-black tracking-tight uppercase italic">
                  {tool.name}
                </h1>
                <span className="bg-black text-[#666] text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-[#1f1f1f]">
                  {tool.category}
                </span>
              </div>
              <p className="text-lg text-[#888] font-medium leading-relaxed">
                {tool.tagline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-10">
              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                  Analysis Engine
                </h2>
                <p className="text-[#aaa] leading-relaxed text-base font-medium italic">
                  "{tool.description}"
                </p>
              </section>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                  <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {tool.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-[#666] font-bold flex items-center gap-2 italic"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 rounded border border-[#1f1f1f] bg-black space-y-4">
                  <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                    Risks
                  </h3>
                  <ul className="space-y-3">
                    {tool.weaknesses.map((s, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-[#666] font-bold flex items-center gap-2 italic"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

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

              {tool.alternatives && tool.alternatives.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
                    Alternatives
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tool.alternatives.map((alt, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded bg-[#0a0a0a] border border-[#1f1f1f] text-[11px] text-[#666] font-bold"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:col-span-5 space-y-10">
              <div className="flex flex-col gap-3">
                <a
                  href={tool.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:bg-[#eee] transition-all uppercase tracking-widest"
                >
                  Open Resource <ArrowUpRight size={18} />
                </a>
                <button className="bg-black border border-[#1f1f1f] text-[#888] py-4 rounded font-bold text-xs flex items-center justify-center gap-3 hover:text-white transition-all uppercase tracking-widest">
                  <ThumbsUp size={16} /> Upvote
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-[#444] hover:text-white">
                    <Heart size={14} /> Like
                  </button>
                  <button className="flex-1 border border-[#1f1f1f] py-4 rounded flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-[#444] hover:text-white">
                    <Star size={14} /> Save
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
                    <span className="text-white font-bold">{tool.votes}</span>
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
    </div>
  );
}

