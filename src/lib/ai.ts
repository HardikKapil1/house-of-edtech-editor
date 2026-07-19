import { GoogleGenAI } from "@google/genai";

/**
 * Singleton Gemini client.
 * Uses the API key from environment variables.
 */
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});