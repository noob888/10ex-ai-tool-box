import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { ToolDetailPage } from '@/components/ToolDetailPage';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(id);

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
  const { id } = await params;
  const toolsRepo = new ToolsRepository();
  const tool = await toolsRepo.findById(id);

  if (!tool) {
    notFound();
  }

  // Get FAQ and use cases from database (already generated and cached)
  const [enrichment, relatedTools] = await Promise.all([
    toolsRepo.getEnrichment(tool.id).catch(() => ({ faqs: [], useCases: [] })),
    toolsRepo.findTopRatedByCategory(tool.category, 9).catch(() => []),
  ]);

  const faqs = enrichment.faqs || [];
  const useCases = enrichment.useCases || [];

  // Generate structured data with FAQ and use cases
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
      "ratingValue": Math.max(1, Math.min(5, (tool.rating / 100) * 5)),
      "ratingCount": tool.votes || 1,
      "bestRating": 5,
      "worstRating": 1,
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Organization",
          "name": "AI Tool Box"
        },
        "datePublished": tool.launchDate || new Date().toISOString().split('T')[0],
        "reviewBody": `${tool.description} Best for: ${tool.bestFor}. Strengths: ${tool.strengths.join(', ')}.`,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": Math.max(1, Math.min(5, (tool.rating / 100) * 5)),
          "bestRating": 5,
          "worstRating": 1
        }
      }
    ],
    "url": tool.websiteUrl,
    ...(faqs.length > 0 && {
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      },
    }),
  };

  // Add breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_SITE_URL || "https://tools.10ex.ai",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": tool.category,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://tools.10ex.ai"}/best-ai-for/${tool.category.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": tool.name,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://tools.10ex.ai"}/tool/${tool.id}`,
      },
    ],
  };

  // Add HowTo structured data for use cases
  const howToData = useCases.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to use ${tool.name}`,
    "description": `Use cases and guides for ${tool.name}`,
    "step": useCases.map((useCase, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": useCase.title,
      "text": useCase.description,
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      {howToData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(howToData),
          }}
        />
      )}
      <ToolDetailPage 
        tool={tool} 
        faqs={faqs}
        useCases={useCases}
        relatedTools={relatedTools}
      />
    </>
  );
}

