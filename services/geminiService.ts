
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService;
  private ai: any;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async analyzeImage(base64: string, mimeType: string) {
    const prompt = `Analyze this image carefully. 
    1. Categorize it into exactly one of: nature, urban, people, food, travel, other.
    2. Provide a short, poetic, and descriptive title.
    3. Estimate the date (YYYY-MM).
    4. List 5-8 descriptive tags (objects, colors, moods, scenes, or people types) found in the image.`;
    
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            guessedDate: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of descriptive labels for search and organization"
            }
          },
          required: ["category", "title", "tags"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return { 
        category: 'other', 
        title: 'Untitled Image', 
        guessedDate: new Date().toISOString().slice(0, 7),
        tags: ['photo'] 
      };
    }
  }

  async animateImage(base64: string, mimeType: string, prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic motion: ${prompt}. Slow pan or subtle movement. High quality.`,
      image: {
        imageBytes: base64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  }
}
