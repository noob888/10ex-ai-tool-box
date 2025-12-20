import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { ToolDetailPage } from '@/components/ToolDetailPage';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(params.id);

  if (!tool) {
    return {
      title: 'Tool Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.10ex.ai';
  
  return {
    title: `${tool.name} - ${tool.tagline} | AI Tool Box`,
    description: `${tool.description} Rating: ${tool.rating}%. Best for: ${tool.bestFor}. Pricing: ${tool.pricing}.`,
    keywords: [
      tool.name,
      tool.category,
      tool.subCategory,
      'AI tool',
      'AI software',
      tool.pricing,
      ...tool.strengths,
    ],
    openGraph: {
      title: `${tool.name} - ${tool.tagline}`,
      description: tool.description,
      type: 'website',
      url: `${baseUrl}/tool/${tool.id}`,
      images: [
        {
          url: `${baseUrl}/og-tool-${tool.id}.png`,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - ${tool.tagline}`,
      description: tool.description,
    },
    alternates: {
      canonical: `${baseUrl}/tool/${tool.id}`,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(params.id);

  if (!tool) {
    notFound();
  }

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": tool.name,
    "description": tool.description,
    "applicationCategory": "AI Tool",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": tool.pricing === "Free" ? "0" : "Varies",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": tool.rating / 10,
      "ratingCount": tool.votes,
      "bestRating": 10,
      "worstRating": 0,
    },
    "url": tool.websiteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <ToolDetailPage tool={tool} />
    </>
  );
}

