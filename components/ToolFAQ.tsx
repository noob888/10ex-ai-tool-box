'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQItem[];
}

export function ToolFAQ({ faqs }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-[#1f1f1f] bg-black rounded overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#0a0a0a] transition-all"
            >
              <span className="text-sm font-bold text-white pr-4">
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp size={18} className="text-[#666] shrink-0" />
              ) : (
                <ChevronDown size={18} className="text-[#666] shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-sm text-[#aaa] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
