
import { GoogleGenAI } from "@google/genai";

// تهيئة العميل باستخدام مفتاح API من متغيرات البيئة مباشرة
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * استخدام نموذج gemini-2.5-flash-image لتعديل الصور أو الرسومات التعليمية
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // البحث عن جزء الصورة في الرد (كما تقتضي التعليمات)
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw error;
  }
};
