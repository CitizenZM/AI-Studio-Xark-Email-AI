import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  async generateDraft(
    systemPrompt: string, 
    publisherContext: any, 
    threadContext?: string
  ): Promise<{ subject: string; body: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      STRATEGIC CONTEXT:
      - We are Xark, a high-performance affiliate platform.
      - Partner: ${publisherContext.company} (${publisherContext.website})
      - Bio: ${publisherContext.bio || 'A growing publisher in the affiliate space.'}
      - Promotion Style: ${publisherContext.promo_methods?.join(', ') || 'Various digital channels'}
      - Traffic Profile: ${publisherContext.traffic_estimate || 'Confidential'}
      - Priority Tier: ${publisherContext.tier || 'Standard'}
      
      ${threadContext ? `PREVIOUS CONVERSATION HISTORY:\n${threadContext}` : 'INITIAL OUTREACH: This is our first contact with this publisher.'}
      
      INSTRUCTIONS:
      1. Use the provided context to create a hyper-personalized response.
      2. If conversation history exists, continue the thread naturally.
      3. DO NOT use generic placeholders like [Name] or [Company]; use the actual data provided.
      4. The tone should be ${systemPrompt}.
      5. Keep the message concise but compelling.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { 
                type: Type.STRING,
                description: "A short, engaging email subject line."
              },
              body: { 
                type: Type.STRING, 
                description: "The full personalized message body."
              },
            },
            required: ["subject", "body"],
          },
        }
      });

      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error("Gemini Drafting Error:", error);
      return {
        subject: `Partnership Update: Xark x ${publisherContext.company}`,
        body: `Hi ${publisherContext.contact_person || 'Team'},\n\nI was looking at ${publisherContext.website} again and wanted to reach out regarding our potential partnership. We're seeing great results in the ${publisherContext.vertical_fit?.[0] || 'affiliate'} space and think you'd be a perfect fit.\n\nBest,\nThe Xark Team`
      };
    }
  }
}

export const geminiService = new GeminiService();