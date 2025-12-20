'use client';

import dynamic from 'next/dynamic';

// Dynamically import the main app component to avoid SSR issues
const App = dynamic(() => import('@/components/App'), {
  ssr: false,
});

export default function Home() {
  return <App />;
}

