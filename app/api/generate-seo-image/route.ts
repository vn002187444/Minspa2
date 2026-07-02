import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";
import { FALLBACK_IMAGES as SHARED_FALLBACK_IMAGES } from "@/lib/fallback-images";

function getSearchQuery(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("nail") || lower.includes("móng")) return "nail salon beauty";
  if (lower.includes("hair") || lower.includes("tóc") || lower.includes("gội")) return "hair salon haircut";
  if (lower.includes("spa") || lower.includes("massage")) return "spa massage relaxation";
  return "beauty salon spa";
}

function pickRandom(): string {
  return SHARED_FALLBACK_IMAGES[Math.floor(Math.random() * SHARED_FALLBACK_IMAGES.length)];
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
      // Unsplash urls.regular already includes query params, do NOT append extra
      return result.urls.regular;
    }
  } catch {}
  return null;
}

async function tryGeminiImage(prompt: string, genAI: GoogleGenAI): Promise<string | null> {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["Image"] as never,
      },
    });
    if (result.candidates?.[0]?.content?.parts?.length) {
      const part = result.candidates[0].content.parts[0];
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch {
    // Gemini image generation not available, fall through
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER' && session.user.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const prompt = (body.prompt || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Try Gemini AI image generation (gemini-2.0-flash-exp-image-generation)
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      try {
        const genAI = new GoogleGenAI({ apiKey: key });
        const geminiImage = await tryGeminiImage(prompt, genAI);
        if (geminiImage) {
          return NextResponse.json({ image: geminiImage, method: "AI" });
        }
      } catch {
        // Gemini image gen failed, continue to fallback
      }
    }

    // Fallback: search Unsplash API for a random relevant image
    const searchQuery = getSearchQuery(prompt);
    const unsplashImage = await searchUnsplash(searchQuery);
    if (unsplashImage) {
      return NextResponse.json({ image: unsplashImage, method: "UNSPLASH" });
    }

    // Final fallback: pick a random image from the shared pool
    return NextResponse.json({ image: pickRandom(), method: "STOCK" });
  } catch (error: unknown) {
    console.warn("[IMAGE GENERATION CRITICAL ERROR]", error);
    return NextResponse.json({ image: pickRandom(), method: "STOCK", isFallback: true });
  }
}
