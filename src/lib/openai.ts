import OpenAI from "openai";

// During build time, we allow the API key to be missing
// It will be validated at runtime when actually used
const apiKey = process.env.OPENAI_API_KEY || "dummy-key-for-build";

// Only create the OpenAI client if we have a real API key
// This prevents errors during build while still ensuring proper runtime validation
export const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export const DEFAULT_MODEL = "gpt-4-turbo-preview";

export const AVAILABLE_MODELS = [
  { id: "gpt-4-turbo-preview", name: "GPT-4 Turbo" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];
