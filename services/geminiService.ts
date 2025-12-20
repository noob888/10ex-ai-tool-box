
import { GoogleGenAI } from "@google/genai";
import { Tool } from "../types";

export const getAIRecommendations = async (query: string, tools: Tool[]): Promise<{ text: string, recommendedToolIds: string[] }> => {
  try {
    // Strictly follow rule: Use process.env.API_KEY directly. 
    // The index.html global shim ensures this doesn't throw if undefined in other contexts.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

    const toolContext = tools.slice(0, 150).map(t => `${t.id}: ${t.name} - ${t.tagline}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are the AI Tool Box expert. 
      User Query: "${query}"
      
      Available Tools (subset):
      ${toolContext}
      
      Instructions:
      1. Provide a concise, opinionated answer.
      2. Identify the top 3 tool IDs from the list provided that perfectly match the user query.
      3. Explain briefly why these tools were chosen.
      4. At the end of your response, add a section exactly like this: "TOOLS_JSON:[id1, id2, id3]".
      
      Tone: Expert, helpful, minimalist.`,
    });

    const fullText = response.text || "";
    const jsonMatch = fullText.match(/TOOLS_JSON:\[(.*?)\]/);
    let recommendedToolIds: string[] = [];
    let cleanText = fullText;

    if (jsonMatch) {
      recommendedToolIds = jsonMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
      cleanText = fullText.replace(/TOOLS_JSON:\[.*?\]/, '').trim();
    }

    return { text: cleanText, recommendedToolIds };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "I hit a snag. Try browsing our category rankings!", recommendedToolIds: [] };
  }
};
