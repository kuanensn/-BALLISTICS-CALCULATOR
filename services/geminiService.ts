import { GoogleGenAI } from "@google/genai";
import { BallisticInput, TrajectoryPoint, ChatMessage } from '../types';

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    // Assume this variable is pre-configured, valid, and accessible.
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

export const generateBallisticAdvice = async (
  inputs: BallisticInput,
  table: TrajectoryPoint[],
  userQuery: string,
  history: ChatMessage[]
): Promise<string> => {
  const client = getClient();
  
  // Summarize table (Every 10m)
  const summary = table
    .filter((_, i) => i % 10 === 0)
    .map(p => `D:${p.distance.toFixed(0)}m Drop:${p.drop.toFixed(1)}cm V:${p.velocity.toFixed(0)} E:${p.energy.toFixed(2)}J`)
    .join(' | ');

  const historyContext = history.map(m => `${m.role === 'user' ? 'User' : 'Expert'}: ${m.text}`).join('\n');

  const contextPrompt = `
    Role: Expert Airsoft Technician.
    
    User Loadout:
    - Muzzle: ${inputs.velocity} ${inputs.isMetric ? 'm/s' : 'fps'} w/ ${inputs.bulletWeight}g BB
    - Hop-Up: ${inputs.hopUpLevel}%
    - Env: ${inputs.temperature}C, ${inputs.humidity}% Hum
    
    Trajectory Data:
    ${summary}

    Conversation History:
    ${historyContext}
    
    User Query: ${userQuery}
    
    Instructions:
    - Focus on airsoft mechanics: Hop-up (Magnus Effect), air seal, barrel quality, and bb weight.
    - If user asks about effective range, use the data where Drop is within +/- 15cm.
    - Mention "Joule Creep" if they are using heavy BBs in Gas guns.
    - Keep answers short, tactical, and use metric units.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
    });
    return response.text || "No advice generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Connection error. Please check your network.";
  }
};