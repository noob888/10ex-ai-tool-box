// Service to generate FAQ and use cases for tools using Gemini
import { GoogleGenAI } from "@google/genai";
import { Tool } from '@/types';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface UseCase {
  title: string;
  description: string;
}

/**
 * Retry with exponential backoff for rate limit errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429')) {
        const delay = initialDelay * Math.pow(2, attempt);
        let retryAfter = delay;
        if (error?.retryDelay) {
          retryAfter = error.retryDelay;
        } else if (error?.details && Array.isArray(error.details)) {
          const retryInfo = error.details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          if (retryInfo?.retryDelay) {
            retryAfter = typeof retryInfo.retryDelay === 'number' 
              ? retryInfo.retryDelay * 1000 
              : retryInfo.retryDelay;
          }
        }
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Generate FAQ for a tool
 */
export async function generateToolFAQ(tool: Tool): Promise<FAQItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Generate 5-8 common questions and answers about the AI tool "${tool.name}".

Tool Information:
- Name: ${tool.name}
- Tagline: ${tool.tagline}
- Description: ${tool.description}
- Category: ${tool.category}
- Strengths: ${tool.strengths.join(', ')}
- Weaknesses: ${tool.weaknesses.join(', ')}
- Pricing: ${tool.pricing}
- Best for: ${tool.bestFor}

Generate realistic, helpful FAQs that users would actually ask about this tool. Focus on:
- What the tool does
- Who should use it
- Pricing and limitations
- Key features
- Common use cases
- Comparisons with alternatives

Return as JSON array:
[
  {
    "question": "What is [Tool Name]?",
    "answer": "Detailed answer..."
  }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      } as any);
    });

    const responseText = result.text || '';
    const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText.trim();
    const faqs = JSON.parse(jsonStr);
    
    if (!Array.isArray(faqs)) {
      return [];
    }

    return faqs.slice(0, 8);
  } catch (error: any) {
    console.error(`Failed to generate FAQ for ${tool.name}:`, error.message);
    return [];
  }
}

/**
 * Generate use cases for a tool
 */
export async function generateToolUseCases(tool: Tool): Promise<UseCase[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Generate 5-7 specific use cases for the AI tool "${tool.name}".

Tool Information:
- Name: ${tool.name}
- Tagline: ${tool.tagline}
- Description: ${tool.description}
- Category: ${tool.category}
- Strengths: ${tool.strengths.join(', ')}
- Best for: ${tool.bestFor}

Generate concrete, actionable use cases that show how this tool can be used in real-world scenarios. Each use case should have:
- A clear title (what you're doing)
- A detailed description (how the tool helps)

Return as JSON array:
[
  {
    "title": "Use Case Title",
    "description": "Detailed description of how to use the tool for this purpose..."
  }
]

Return ONLY the JSON array, no additional text.`;

  try {
    const result = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      } as any);
    });

    const responseText = result.text || '';
    const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText.trim();
    const useCases = JSON.parse(jsonStr);
    
    if (!Array.isArray(useCases)) {
      return [];
    }

    return useCases.slice(0, 7);
  } catch (error: any) {
    console.error(`Failed to generate use cases for ${tool.name}:`, error.message);
    return [];
  }
}
