import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

// Directly use process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseSmartTask = async (input: string): Promise<{
  title: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a smart task parser for a productivity app. 
      Current Date: ${new Date().toISOString()}.
      
      Extract the following from the user input:
      - title: The main task text (concise).
      - priority: 0 (None), 1 (Low), 2 (Medium), 3 (High).
      - dueDate: ISO 8601 date string.
      - tags: Array of strings.

      User Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.INTEGER },
            dueDate: { type: Type.STRING, nullable: true },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'priority', 'tags']
        }
      }
    });

    const text = response.text;
    if (!text) return { title: input, priority: Priority.None, tags: [] };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Parsing failed:", error);
    return { title: input, priority: Priority.None, tags: [] };
  }
};

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the following task into 3-5 concrete, actionable short subtasks.
      Task: "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Subtasks failed:", error);
    return [];
  }
};

export const parseImageTask = async (base64Data: string, mimeType: string): Promise<{
  title: string;
  description: string;
  tags: string[];
}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this image and create a task based on it. Provide a title, description, and relevant tags." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'description', 'tags']
        }
      }
    });

    const text = response.text;
    if (!text) return { title: "New Task from Image", description: "", tags: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Image Task failed:", error);
    return { title: "Image Task", description: "Error parsing image", tags: [] };
  }
};

export const parseVoiceTask = async (base64Data: string, mimeType: string): Promise<{
  title: string;
  priority: Priority;
  tags: string[];
}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Transcribe this audio and convert it into a task. Extract title, priority (0-3), and tags." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.INTEGER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'priority', 'tags']
        }
      }
    });

    const text = response.text;
    if (!text) return { title: "Voice Note", priority: Priority.None, tags: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Voice Task failed:", error);
    return { title: "Voice Task Error", priority: Priority.None, tags: [] };
  }
};
