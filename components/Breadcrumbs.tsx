'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: Props) {
  const allItems = [
    { label: 'Home', href: '/' },
    ...items,
  ];

  return (
    <nav className="flex items-center gap-2 text-sm text-[#666] mb-6" aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index === 0 ? (
            <Link
              href={item.href || '#'}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Home size={14} />
            </Link>
          ) : (
            <>
              <ChevronRight size={14} className="text-[#444]" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-white">{item.label}</span>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
