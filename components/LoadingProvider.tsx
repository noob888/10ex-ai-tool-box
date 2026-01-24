'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingMessage?: string;
  setLoadingMessage: (message: string | undefined) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  setLoadingMessage: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const pathname = usePathname();

  // Clear loading when route changes (navigation completed)
  useEffect(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading, loadingMessage, setLoadingMessage }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-8 md:p-12 flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
            <div className="relative">
              <Loader2 size={40} className="text-electric-blue animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-electric-blue/30 border-t-electric-blue rounded-full animate-spin" />
              </div>
            </div>
            {loadingMessage && (
              <p className="text-sm font-black text-white uppercase tracking-widest text-center">
                {loadingMessage}
              </p>
            )}
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};
