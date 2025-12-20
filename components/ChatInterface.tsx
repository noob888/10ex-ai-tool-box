'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, ChevronLeft } from 'lucide-react';
import { getAIRecommendations } from '../services/geminiService';
import { Tool } from '../types';
import { ToolCard } from './ToolCard';

interface Message {
  role: 'bot' | 'user';
  content: string;
  recommendedTools?: Tool[];
}

interface Props {
  tools: Tool[];
  initialQuery?: string;
  onBack?: () => void;
  onToolClick: (tool: Tool) => void;
  onVote: (tool: Tool) => void;
  onInput?: () => void;
  onLike?: (tool: Tool) => void;
  onStar?: (tool: Tool) => void;
  isLiked?: (toolId: string) => boolean;
  isStarred?: (toolId: string) => boolean;
}

export const ChatInterface: React.FC<Props> = ({ tools, initialQuery, onBack, onToolClick, onVote, onInput, onLike, onStar, isLiked, isStarred }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Stack Analysis Hub. What's the target outcome?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successfulResponses, setSuccessfulResponses] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialQuerySentRef = useRef(false);
  const lastSentQueryRef = useRef<string>('');

  useEffect(() => {
    if (initialQuery && !initialQuerySentRef.current) {
      initialQuerySentRef.current = true;
      // Reset lastSentQueryRef to allow initial query
      lastSentQueryRef.current = '';
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (queryOverride?: string) => {
    const query = queryOverride || input.trim();
    if (!query || isLoading) return;

    const trimmedQuery = query.trim();
    
    // Prevent duplicate messages using ref (synchronous check)
    if (lastSentQueryRef.current === trimmedQuery) {
      return; // Duplicate query detected, exit early
    }
    
    // Update ref to track this query
    lastSentQueryRef.current = trimmedQuery;
    
    // Add user message
    setMessages(prev => {
      // Double-check for duplicates in state (in case of race conditions)
      const lastUserMessage = prev.filter(m => m.role === 'user').pop();
      if (lastUserMessage?.content === trimmedQuery) {
        lastSentQueryRef.current = ''; // Reset ref if duplicate found in state
        return prev;
      }
      return [...prev, { role: 'user', content: trimmedQuery }];
    });

    if (!queryOverride) setInput('');
    setIsLoading(true);

    try {
      const { text, recommendedToolIds } = await getAIRecommendations(query, tools);
      
      const recommendedTools = recommendedToolIds
        .map(id => tools.find(t => t.id === id))
        .filter((t): t is Tool => !!t);

      // Prevent duplicate bot responses
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        // If the last message is already a bot response with the same content, don't add it again
        if (lastMessage?.role === 'bot' && lastMessage.content === text) {
          return prev;
        }
        return [...prev, { 
          role: 'bot', 
          content: text,
          recommendedTools 
        }];
      });
      
      // Only count as successful if we got a valid response with content
      if (text && text.trim().length > 0 && !text.includes("I hit a snag") && !text.includes("API key not configured")) {
        setSuccessfulResponses(prev => {
          const newCount = prev + 1;
          // Show signup prompt after 5 successful responses
          if (newCount === 5 && onInput) {
            onInput();
          }
          return newCount;
        });
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I encountered an error. Please try again or check your API key configuration."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-[#444] hover:text-white mb-6 font-bold transition-colors text-xs uppercase tracking-widest">
          <ChevronLeft size={16} /> Close Hub
        </button>
      )}

      {successfulResponses >= 5 && (
        <div className="mb-4 p-4 rounded-lg border border-electric-blue/30 bg-electric-blue/5">
          <p className="text-xs text-electric-blue font-bold uppercase tracking-widest text-center">
            🎉 You've made {successfulResponses} queries! Sign up to unlock unlimited access.
          </p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-6 p-4 mb-4 scrollbar-hide" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-lg flex gap-4 border ${
              msg.role === 'user' 
              ? 'bg-[#111] text-white border-[#333]' 
              : 'bg-[#0a0a0a] text-gray-300 border-[#1f1f1f]'
            }`}>
              <div className="flex-shrink-0 mt-1">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-electric-blue" />}
              </div>
              <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-sm">
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className="mb-2">{line}</p>
                ))}
              </div>
            </div>

            {msg.recommendedTools && msg.recommendedTools.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {msg.recommendedTools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onClick={onToolClick} 
                    onVote={onVote} 
                    onLike={onLike || (() => {})} 
                    onStar={onStar || (() => {})} 
                    isLiked={isLiked ? isLiked(tool.id) : false}
                    isStarred={isStarred ? isStarred(tool.id) : false}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-lg flex items-center gap-3">
              <Loader2 className="animate-spin text-electric-blue" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Analyzing Global Index...</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#1f1f1f] mt-4 relative">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Search AI tool directory via chat..."
            className="w-full bg-black border border-[#1f1f1f] rounded py-3 pl-6 pr-12 focus:outline-none focus:border-[#333] transition-all text-sm font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1.5 w-9 h-9 bg-white text-black rounded flex items-center justify-center hover:bg-[#eee] transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
