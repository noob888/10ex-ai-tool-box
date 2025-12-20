'use client';

import { Tool } from '@/types';

interface StructuredDataProps {
  type: 'BreadcrumbList' | 'Organization' | 'WebSite' | 'ItemList' | 'SoftwareApplication';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

interface BreadcrumbProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbProps) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

interface ToolListStructuredDataProps {
  tools: Tool[];
  title: string;
  description: string;
}

export function ToolListStructuredData({ tools, title, description }: ToolListStructuredDataProps) {
  return (
    <StructuredData
      type="ItemList"
      data={{
        name: title,
        description,
        numberOfItems: tools.length,
        itemListElement: tools.slice(0, 20).map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.name,
            description: tool.tagline,
            applicationCategory: tool.category,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: tool.rating / 10,
              ratingCount: tool.votes,
            },
          },
        })),
      }}
    />
  );
}

