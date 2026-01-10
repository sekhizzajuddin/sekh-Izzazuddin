
import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const verifyAnswer = async (question: string, answer: string) => {
  // Fix: Assuming API_KEY is pre-configured as per guidelines
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify the accuracy of this Q&A pair and provide a brief suggestion for improvement if necessary. 
      Question: ${question}
      Answer: ${answer}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Verification failed due to an API error.";
  }
};
