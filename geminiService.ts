
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  async generateDraft(
    systemPrompt: string, 
    publisherContext: {
      company: string;
      website: string;
      tier: string;
      bio?: string;
      contact_person?: string;
      promo_methods?: string[];
      vertical_fit?: string[];
    }, 
    threadContext?: string
  ): Promise<{ subject: string; body: string }> {
    // Initializing Gemini client using the environment's pre-configured key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      INTERNAL CONTEXT:
      Platform: Xark (High-performance Affiliate Network)
      Partner: ${publisherContext.company} (${publisherContext.website})
      Classification: Tier ${publisherContext.tier}
      Verticals: ${publisherContext.vertical_fit?.join(', ') || 'N/A'}
      Partner Bio: ${publisherContext.bio || 'Affiliate publisher.'}
      
      ${threadContext ? `CONVERSATION LOGS:\n${threadContext}` : 'No previous history. This is a first-time outreach.'}
      
      OBJECTIVE:
      Generate a professional and engaging affiliate outreach message. 
      Tailor the tone specifically to the publisher's bio and the existing thread context.
      Do not use generic placeholders like [Name]; use ${publisherContext.contact_person || 'their team'} if appropriate.
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
                description: "A compelling subject line for the email thread."
              },
              body: { 
                type: Type.STRING, 
                description: "The personalized body of the email/message."
              },
            },
            required: ["subject", "body"],
          },
        }
      });

      // Accessing the .text property directly as per latest SDK guidelines
      const jsonStr = response.text || '{}';
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      // Fallback response in case of API failure
      return {
        subject: `Partnership Update: Xark x ${publisherContext.company}`,
        body: `Hi ${publisherContext.contact_person || 'Team'},\n\nI hope you're having a great week. We've been reviewing the performance at ${publisherContext.website} and believe there's a strong opportunity to deepen our partnership with some of our upcoming Q3 campaigns.\n\nLet me know if you're available for a quick chat next week.\n\nBest regards,\nThe Xark Team`
      };
    }
  }
}

export const geminiService = new GeminiService();
