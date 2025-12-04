import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TranslationDomain } from "../types";

// Schema for structured JSON output
const translationSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING
  },
  description: "An array of translated strings corresponding exactly to the input strings.",
};

export class GeminiTranslator {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string) {
    // In a real browser environment without a proxy, this might hit CORS if not configured correctly on the server side,
    // or if using the old SDK. The new SDK and standard fetch might still have CORS issues if 'dangerouslyAllowBrowser' isn't valid or applicable.
    // However, per instructions, we proceed with standard usage.
    this.client = new GoogleGenAI({ apiKey });
    // Using flash for speed/cost effectiveness in batching
    this.modelName = 'gemini-2.5-flash'; 
  }

  async translateBatch(
    texts: string[], 
    sourceLang: string, 
    targetLang: string, 
    domain: TranslationDomain,
    customContext: string
  ): Promise<string[]> {
    
    // Construct System Instruction based on Domain
    let systemInstruction = `You are a professional subtitle translator. Translate the following array of text strings from ${sourceLang} to ${targetLang}.`;
    
    switch (domain) {
      case TranslationDomain.XIANXIA:
        systemInstruction += ` Context: Wuxia/Xianxia (Tu Tien). Use appropriate Sino-Vietnamese terminology (Hán Việt) for cultivation terms, ranks, and martial arts. Tone: Ancient, epic, formal.`;
        break;
      case TranslationDomain.TECHNICAL:
        systemInstruction += ` Context: Technical/Academic. Be precise, use standard terminology, and maintain a formal tone.`;
        break;
      case TranslationDomain.MODERN:
        systemInstruction += ` Context: Modern Life/Slang. Use natural, conversational language suitable for contemporary settings.`;
        break;
      case TranslationDomain.MOVIE:
        systemInstruction += ` Context: Movie/Drama. Focus on emotional nuance and brevity suitable for subtitles.`;
        break;
    }

    if (customContext) {
      systemInstruction += ` Additional Instructions: ${customContext}`;
    }

    systemInstruction += `\nCRITICAL: Return ONLY a JSON array of strings. The length of the output array MUST match the input array length exactly. Do not merge or split lines.`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify(texts) }]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: translationSchema,
          temperature: 0.3, // Lower temperature for more consistent translation
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        throw new Error("API returned invalid format (not an array)");
      }

      // Basic validation to ensure count matches roughly, or handle mismatches gracefully
      // If mismatch, we might pad or truncate, but let's return what we got
      return parsed.map(String);

    } catch (error) {
      console.error("Gemini Translation Error:", error);
      throw error;
    }
  }
}