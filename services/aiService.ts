import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment variable access failed", e);
  }
  return "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const parseSmartTask = async (input: string): Promise<{
  title: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a smart task parser for a todo app. 
      Current Date: ${new Date().toISOString()}.
      
      Extract the following from the user input:
      - title: The main task text (remove date/priority keywords if they are extracted).
      - priority: 0 (None), 1 (Low), 2 (Medium), 3 (High). Look for words like 'urgent', 'high', '!high', '!3'.
      - dueDate: ISO 8601 date string. Look for 'tomorrow', 'next friday', 'at 5pm', etc.
      - tags: Array of strings. Look for hashtags like '#work'. Remove the '#' in the result.

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
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { title: input, priority: Priority.None, tags: [] };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Parsing failed:", error);
    // Fallback
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