import { GoogleGenAI } from "@google/genai";
import { getAiCache, setAiCache } from "@/lib/ai-cache";

const MODELS = {
  primary: "gemini-3.1-flash-lite",
  fallback: "gemini-2.5-flash-lite",
} as const;

const TIMEOUT_MS = 12000;

interface JsonSchema {
  type: string;
  properties?: Record<string, any>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  description?: string;
}

interface CallGeminiOptions {
  systemInstruction?: string;
  prompt: string;
  config?: Record<string, any>;
  jsonSchema?: JsonSchema;
  useCache?: boolean;
  cacheKey?: string;
  timeout?: number;
}

interface CallGeminiResult {
  text: string | null;
  sources?: { title?: string; uri?: string }[];
  modelUsed: string;
  fromCache?: boolean;
}

function isQuotaError(err: any): boolean {
  return (
    err?.status === 429 ||
    err?.message?.includes("quota") ||
    err?.message?.includes("RESOURCE_EXHAUSTED") ||
    err?.message?.includes("429")
  );
}

function hashKey(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function callGemini(options: CallGeminiOptions): Promise<CallGeminiResult> {
  const cacheKey = options.cacheKey || (options.useCache ? hashKey((options.systemInstruction || "") + options.prompt) : null);

  if (cacheKey) {
    const cached = await getAiCache(cacheKey);
    if (cached) {
      return { text: cached.text || null, sources: cached.sources || [], modelUsed: cached.modelUsed || MODELS.primary, fromCache: true };
    }
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return { text: null, sources: [], modelUsed: MODELS.primary };

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: { headers: { "User-Agent": "aistudio-build" }, timeout: options.timeout || TIMEOUT_MS },
  });

  const modelsToTry = [MODELS.primary, MODELS.fallback];

  for (const model of modelsToTry) {
    try {
      const genConfig: Record<string, any> = {
        ...options.config,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      };

      if (options.jsonSchema) {
        genConfig.responseMimeType = "application/json";
        genConfig.responseSchema = options.jsonSchema;
      }

      const reqBody: Record<string, any> = {
        model,
        contents: options.prompt,
        config: Object.keys(genConfig).length ? genConfig : undefined,
      };

      if (options.systemInstruction) {
        reqBody.systemInstruction = options.systemInstruction;
      }

      const res = await ai.models.generateContent(reqBody as any);

      const sources =
        res.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title,
          uri: chunk.web?.uri,
        })) || [];

      const result: CallGeminiResult = {
        text: res.text?.trim() || null,
        sources: sources.slice(0, 3),
        modelUsed: model,
        fromCache: false,
      };

      if (cacheKey) {
        await setAiCache(cacheKey, { text: result.text, sources: result.sources, modelUsed: result.modelUsed });
      }

      return result;
    } catch (err: unknown) {
      console.warn(`[GEMINI] ${model} failed:`, err instanceof Error ? err.message : String(err));
      if (!isQuotaError(err) || model === modelsToTry[modelsToTry.length - 1]) {
        return { text: null, sources: [], modelUsed: model, fromCache: false };
      }
    }
  }

  return { text: null, sources: [], modelUsed: MODELS.primary, fromCache: false };
}
