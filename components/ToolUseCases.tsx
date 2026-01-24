'use client';

interface UseCase {
  title: string;
  description: string;
}

interface Props {
  useCases: UseCase[];
}

export function ToolUseCases({ useCases }: Props) {
  if (!useCases || useCases.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444]">
        Use Cases
      </h2>
      <ol className="space-y-4">
        {useCases.map((useCase, index) => (
          <li key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center text-[10px] font-black text-[#666]">
              {index + 1}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-white">
                {useCase.title}
              </h3>
              <p className="text-sm text-[#aaa] leading-relaxed">
                {useCase.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
