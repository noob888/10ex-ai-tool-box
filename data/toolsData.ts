
import { Tool, Category, PricingTier, PromptTemplate } from '../types';

const categories = Object.values(Category);

const prefixes = ["Neo", "Flow", "Ai", "Synth", "Deep", "Quill", "Vector", "Agent", "Pulse", "Mind", "Hyper", "Prime"];
const suffixes = ["ly", "ify", "base", "hub", "mind", "flow", "core", "node", "ai", "bot", "stack", "vault"];

export const promptsDataset: PromptTemplate[] = [
  {
    id: 'p-adv-1',
    title: "Reverse Role Prompting",
    category: Category.WRITING,
    useCase: "Strategic Alignment",
    prompt: "I want you to become the interviewer. Ask me 10 critical questions about my [Project/Idea] to find its weaknesses. Don't answer them yourself. Wait for my responses one by one to build a full risk assessment profile.",
    level: "Pro",
    copyCount: 1540
  },
  {
    id: 'p-adv-2',
    title: "Chain of Thought Reasoning",
    category: Category.CODING,
    useCase: "Complex Debugging",
    prompt: "Examine this code: [CODE]. First, explain the logic step-by-step. Second, identify potential race conditions. Third, propose a refactored version that implements the factory pattern. Think aloud for each step.",
    level: "Pro",
    copyCount: 2100
  },
  {
    id: 'p-adv-3',
    title: "Few-Shot Style Mimicry",
    category: Category.MARKETING,
    useCase: "Brand Voice",
    prompt: "Here are 3 examples of our brand voice: [EX 1, EX 2, EX 3]. Analyze the tone, sentence structure, and vocabulary. Now, rewrite the following announcement using exactly that style: [ANNOUNCEMENT].",
    level: "Advanced",
    copyCount: 890
  },
  ...Array.from({ length: 117 }).map((_, i) => ({
    id: `prompt-gen-${i}`,
    title: `Production ${categories[i % categories.length]} Template #${i}`,
    category: categories[i % categories.length],
    useCase: "Workflow Optimization",
    prompt: `Generate a structured framework for ${categories[i % categories.length]} using the [INPUT] variables. Focus on scalability and high-concurrency performance metrics.`,
    level: (i % 3 === 0 ? "Beginner" : (i % 3 === 1 ? "Advanced" : "Pro")) as "Beginner" | "Advanced" | "Pro",
    copyCount: Math.floor(Math.random() * 500)
  }))
];

export const generateTools = (): Tool[] => {
  const tools: Tool[] = [];
  
  const baseTools = [
    { id: "chatgpt", name: "ChatGPT", category: Category.WRITING, tagline: "Global AI tool directory leader", rating: 98, pricing: "Freemium" as PricingTier, websiteUrl: "https://chat.openai.com" },
    { id: "claude", name: "Claude 3.5 Sonnet", category: Category.WRITING, tagline: "Top AI tool comparison winner", rating: 99, pricing: "Freemium" as PricingTier, websiteUrl: "https://claude.ai" },
    { id: "midjourney", name: "Midjourney v6", category: Category.DESIGN, tagline: "Professional AI image generator", rating: 98, pricing: "Paid" as PricingTier, websiteUrl: "https://midjourney.com" },
    { id: "cursor", name: "Cursor", category: Category.CODING, tagline: "Advanced AI tool for developers", rating: 99, pricing: "Freemium" as PricingTier, websiteUrl: "https://cursor.com" },
    { id: "perplexity", name: "Perplexity", category: Category.RESEARCH, tagline: "Best AI tool review site choice", rating: 96, pricing: "Freemium" as PricingTier, websiteUrl: "https://perplexity.ai" },
    { id: "heygen", name: "HeyGen", category: Category.VIDEO, tagline: "Viral AI tool directory for video", rating: 95, pricing: "Paid" as PricingTier, websiteUrl: "https://heygen.com" },
  ];

  baseTools.forEach((t) => {
    tools.push({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      category: t.category,
      subCategory: "Core Ecosystem",
      description: `A master-class AI utility that consistently tops our AI tool comparison charts. Perfect for high-performance teams.`,
      strengths: ["Architecture", "Latency", "Reasoning"],
      weaknesses: ["Context window limits", "Pricing volatility"],
      pricing: t.pricing,
      rating: t.rating,
      popularity: Math.floor(Math.random() * 10000) + 5000,
      votes: Math.floor(Math.random() * 5000) + 2000,
      alternatives: [],
      bestFor: "Enterprise scalability",
      overkillFor: "Single-use tasks",
      prompts: promptsDataset.slice(0, 3),
      isVerified: true,
      launchDate: "2023-11-15",
      websiteUrl: t.websiteUrl
    });
  });

  for (let i = 0; i < 594; i++) {
    const category = categories[i % categories.length];
    const name = prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
    const id = `${name.toLowerCase()}-${i}`;
    
    tools.push({
      id,
      name,
      tagline: `Essential AI tool for ${category.toLowerCase()} automation.`,
      category,
      subCategory: "Specialized Nodes",
      description: `Discovered in our AI tool directory for startups. This tool focuses on ${category} optimization.`,
      strengths: ["Security", "Niche Logic", "API Support"],
      weaknesses: ["Community support", "Third-party plugins"],
      pricing: i % 4 === 0 ? "Free" : (i % 3 === 0 ? "Freemium" : "Paid"),
      rating: Math.floor(Math.random() * 30) + 65,
      popularity: Math.floor(Math.random() * 3000),
      votes: Math.floor(Math.random() * 1000),
      alternatives: [],
      bestFor: "Agile teams",
      overkillFor: "Legacy operations",
      prompts: promptsDataset.slice(i % 10, (i % 10) + 2),
      isVerified: Math.random() > 0.7,
      launchDate: "2024-01-20",
      websiteUrl: `https://www.google.com/search?q=${encodeURIComponent(name)}+AI+tool`
    });
  }

  tools.forEach(tool => {
    const sameCat = tools.filter(t => t.category === tool.category && t.id !== tool.id);
    tool.alternatives = sameCat.slice(0, 4).map(t => t.name);
  });

  return tools;
};

export const toolsDataset = generateTools();
