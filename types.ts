
export enum Category {
  WRITING = "Writing & Content",
  RESEARCH = "Research & Search",
  SALES = "Sales & Outreach",
  MARKETING = "Marketing & Ads",
  DESIGN = "Design & Images",
  VIDEO = "Video & Audio",
  CODING = "Coding & Dev Tools",
  DATA = "Data & Analytics",
  AUTOMATION = "Automation & Agents",
  SUPPORT = "Customer Support",
  HR = "HR & Recruiting",
  PRODUCTIVITY = "Productivity & Knowledge",
  FOUNDERS = "Founders & Startups",
  ENTERPRISE = "Enterprise & Ops"
}

export type PricingTier = "Free" | "Freemium" | "Paid" | "Enterprise";

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  referralCode: string;
  joinedAt: string;
  bookmarkedToolIds: string[];
  likedToolIds: string[];
  starredToolIds: string[];
}

export interface CommunityInsight {
  id: string;
  userId: string;
  userName: string;
  toolId: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  toolIds: string[];
  userId: string;
  userName: string;
  upvotes: number;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: Category;
  useCase: string;
  prompt: string;
  level: "Beginner" | "Advanced" | "Pro";
  copyCount: number;
}

export interface Tool {
  id: string;
  name: string;
  tagline: string;
  category: Category;
  subCategory: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing: PricingTier;
  rating: number; 
  popularity: number; 
  votes: number;
  alternatives: string[]; 
  bestFor: string;
  overkillFor: string;
  prompts: PromptTemplate[];
  isVerified: boolean;
  launchDate: string;
  websiteUrl: string;
}
