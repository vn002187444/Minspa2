import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";
import { FALLBACK_IMAGES as SHARED_FALLBACK_IMAGES } from "@/lib/fallback-images";
import { searchUnsplash, searchPexels } from "@/lib/image-search";

function pickRandom(): string {
  return SHARED_FALLBACK_IMAGES[Math.floor(Math.random() * SHARED_FALLBACK_IMAGES.length)];
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
    const provider = body.provider || "gemini";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Try Gemini AI
    if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (key) {
        try {
          const genAI = new GoogleGenAI({ apiKey: key });
          const geminiImage = await tryGeminiImage(prompt, genAI);
          if (geminiImage) {
            return NextResponse.json({ image: geminiImage, method: "AI" });
          }
        } catch { }
      }
      return NextResponse.json({ error: "Gemini generation failed" }, { status: 500 });
    }

    // 2. Try Unsplash
    if (provider === "unsplash") {
        const result = await searchUnsplash(prompt);
        if (result?.images[0]) return NextResponse.json({ image: result.images[0], method: "API" });
        return NextResponse.json({ error: "Unsplash search failed" }, { status: 500 });
    }
    
    // 3. Try Pexels
    if (provider === "pexels") {
        const result = await searchPexels(prompt);
        if (result?.images[0]) return NextResponse.json({ image: result.images[0], method: "API" });
        return NextResponse.json({ error: "Pexels search failed" }, { status: 500 });
    }

    // Fallback
    return NextResponse.json({ image: pickRandom(), method: "STOCK" });
  } catch (error: unknown) {
    console.warn("[IMAGE GENERATION CRITICAL ERROR]", error);
    return NextResponse.json({ image: pickRandom(), method: "STOCK", isFallback: true });
  }
}
