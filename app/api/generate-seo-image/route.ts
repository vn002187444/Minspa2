import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_IMAGES: Record<string, string[]> = {
  nails: [
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1607779097040-26e80b779eef?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-6b1dfde2c4fb?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1596464716127-f2b0b2f1b7a2?w=800&auto=format&fit=crop",
  ],
  haircare: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337661159-0a0b4a2a4b4f?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560752059-53a9b7c0c6b8?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop",
  ],
  spa: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560752059-53a9b7c0c6b8?w=800&auto=format&fit=crop",
  ],
  general: [
    "https://images.unsplash.com/photo-1560066984-58dadb2e71c4?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-6b1dfde2c4fb?w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337661159-0a0b4a2a4b4f?w=800&auto=format&fit=crop",
  ],
};

function getTheme(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("nail") || lower.includes("móng")) return "nails";
  if (lower.includes("hair") || lower.includes("tóc") || lower.includes("gội")) return "haircare";
  if (lower.includes("spa") || lower.includes("massage")) return "spa";
  return "general";
}

function getSearchQuery(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("nail") || lower.includes("móng")) return "nail salon beauty";
  if (lower.includes("hair") || lower.includes("tóc") || lower.includes("gội")) return "hair salon haircut";
  if (lower.includes("spa") || lower.includes("massage")) return "spa massage relaxation";
  return "beauty salon spa";
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function searchUnsplash(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    const data: { results?: { urls: { regular: string } }[] } = await resp.json();
    if (data.results?.length) {
      const result = data.results[Math.floor(Math.random() * data.results.length)];
      return result.urls.regular + "?w=800&auto=format&fit=crop";
    }
  } catch {}
  return null;
}

async function tryGeminiImage(prompt: string, ai: GoogleGenAI): Promise<string | null> {
  // Gemini image generation is currently unstable or deprecated in public API.
  // We fallback to Unsplash and Stock images for stability.
  return null;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Try Gemini AI image generation
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
      const geminiImage = await tryGeminiImage(prompt, ai);
      if (geminiImage) {
        return NextResponse.json({ image: geminiImage, method: "AI" });
      }
    }

    // Fallback: search Unsplash API for a random relevant image
    const searchQuery = getSearchQuery(prompt);
    const unsplashImage = await searchUnsplash(searchQuery);
    if (unsplashImage) {
      return NextResponse.json({ image: unsplashImage, method: "UNSPLASH" });
    }

    // Final fallback: pick a random image from the local pool
    const theme = getTheme(prompt);
    const pool = FALLBACK_IMAGES[theme] || FALLBACK_IMAGES.general;
    return NextResponse.json({ image: pickRandom(pool), method: "STOCK" });
  } catch (error: unknown) {
    console.warn("[IMAGE GENERATION CRITICAL ERROR]", error);
    const prompt = "";
    const theme = getTheme(prompt);
    const pool = FALLBACK_IMAGES[theme] || FALLBACK_IMAGES.general;
    return NextResponse.json({ image: pickRandom(pool), method: "STOCK", isFallback: true });
  }
}
