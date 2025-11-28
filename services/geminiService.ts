import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

export const startChat = (): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
};

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: "1K",
                },
                tools: [{ googleSearch: {} }],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("error_no_image_generated");
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error && error.message === 'error_no_image_generated') {
            throw error;
        }
        throw new Error("error_generate_image");
    }
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string, aspectRatio: string = "1:1"): Promise<string> => {
    try {
        const ai = getAiClient();
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
              imageConfig: {
                  aspectRatio: aspectRatio,
                  imageSize: "1K",
              },
              tools: [{ googleSearch: {} }],
            },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("error_no_edited_image");
    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error && error.message === 'error_no_edited_image') {
            throw error;
        }
        throw new Error("error_edit_image");
    }
};