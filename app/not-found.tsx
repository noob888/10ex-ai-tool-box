'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-8xl font-black text-[#333]">404</h1>
          <h2 className="text-3xl font-black text-white">Page Not Found</h2>
          <p className="text-[#888] text-lg">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="bg-white text-black px-6 py-3 rounded font-bold text-sm flex items-center gap-2 hover:bg-[#eee] transition-all uppercase tracking-widest"
          >
            <Home size={18} /> Go Home
          </Link>
          <Link
            href="/tools"
            className="bg-black border border-[#1f1f1f] text-white px-6 py-3 rounded font-bold text-sm flex items-center gap-2 hover:border-[#333] transition-all uppercase tracking-widest"
          >
            <Search size={18} /> Browse Tools
          </Link>
          <button
            onClick={() => router.back()}
            className="bg-black border border-[#1f1f1f] text-[#888] px-6 py-3 rounded font-bold text-sm flex items-center gap-2 hover:text-white transition-all uppercase tracking-widest"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>

        <div className="pt-8 border-t border-[#1f1f1f]">
          <p className="text-[#666] text-sm mb-4">Popular Pages:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/blog" className="text-[#888] hover:text-white text-sm transition-colors">
              Blog
            </Link>
            <span className="text-[#333]">•</span>
            <Link href="/news" className="text-[#888] hover:text-white text-sm transition-colors">
              News
            </Link>
            <span className="text-[#333]">•</span>
            <Link href="/trending" className="text-[#888] hover:text-white text-sm transition-colors">
              Trending
            </Link>
            <span className="text-[#333]">•</span>
            <Link href="/leaderboards" className="text-[#888] hover:text-white text-sm transition-colors">
              Leaderboards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
