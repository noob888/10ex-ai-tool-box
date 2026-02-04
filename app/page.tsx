import { HomeClient } from '@/components/HomeClient';
import { getToolsCount } from '@/lib/toolsCount';

// Server-rendered SEO shell so crawlers and LLMs get indexable content (home App is client-only)
function HomeSEOShell({ toolsCount }: { toolsCount: number }) {
  const label = toolsCount >= 600 ? `${toolsCount}+` : String(toolsCount);
  return (
    <section
      className="sr-only focus-within:not-sr-only"
      aria-label="Site summary"
    >
      <h1>AI Tool Box – Best AI Tools Directory 2026</h1>
      <p>
        Discover {label} AI tools: writing, design, coding, marketing, productivity, and more.
        Explore <a href="/trending">trending tools</a>, <a href="/free-ai-tools">free AI tools</a>,{' '}
        <a href="/blog">guides and comparisons</a>, <a href="/ai-agents">AI agents</a>, and{' '}
        <a href="/tool/chatgpt">tool pages</a>.
      </p>
    </section>
  );
}

export default async function Home() {
  const toolsCount = await getToolsCount();
  return (
    <>
      <HomeSEOShell toolsCount={toolsCount} />
      <HomeClient />
    </>
  );
}

