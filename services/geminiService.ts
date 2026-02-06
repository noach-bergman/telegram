
import { GoogleGenAI, Type } from "@google/genai";
import { NewsInsight } from "../types";

export class GeminiService {
  async analyzeNews(text: string): Promise<NewsInsight> {
    // Initializing inside the method ensures we always use the freshest available API key
    // and avoids potential syntax issues with static field initialization in some environments.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following Hebrew news item and provide a professional summary, impact level, relevant tags, and sentiment. Return ONLY JSON.
        
        News Content: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A concise professional summary in Hebrew." },
              impact: { type: Type.STRING, enum: ["low", "medium", "high"], description: "The likely impact level of this news." },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Relevant news tags in Hebrew." 
              },
              sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"], description: "The overall sentiment of the news." }
            },
            required: ["summary", "impact", "tags", "sentiment"]
          }
        }
      });

      const resultText = response.text || '{}';
      const result = JSON.parse(resultText);
      return result as NewsInsight;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
