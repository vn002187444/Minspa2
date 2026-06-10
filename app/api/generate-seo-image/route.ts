import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    const body = await req.json();
    prompt = body.prompt || "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    try {
      console.log(`[IMAGE GENERATION] Querying gemini-2.5-flash-image for prompt: "${prompt}"`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const base64Url = `data:${mimeType};base64,${part.inlineData.data}`;
        return NextResponse.json({ image: base64Url, method: "AI" });
      }
    } catch (imageErr: any) {
      console.warn("[IMAGE ERR] Gemini image generation failed or unsupported, using fallback.", imageErr);
    }

    // Elegant fallbacks for nail, hair, spa, massage
    const lowerPrompt = prompt.toLowerCase();
    let theme = "vibrant";
    if (lowerPrompt.includes("nail") || lowerPrompt.includes("móng")) {
      theme = "nails";
    } else if (lowerPrompt.includes("hair") || lowerPrompt.includes("tóc") || lowerPrompt.includes("gội")) {
      theme = "haircare";
    } else if (lowerPrompt.includes("spa") || lowerPrompt.includes("massage")) {
      theme = "spa";
    }

    // Return a beautiful dynamic unsplash image based on query
    const unsplashUrl = `https://images.unsplash.com/photo-1607779097040-26e80b779eef?auto=format&fit=crop&q=80&w=600`; // general nice beauty salon
    const specificUrls: Record<string, string> = {
      nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600", // Nail salon
      haircare: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600", // Hair salon
      spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600", // Massage / Spa
    };

    const imageUrl = specificUrls[theme] || unsplashUrl;
    return NextResponse.json({ image: imageUrl, method: "STOCK" });
  } catch (error: any) {
    console.warn("[GEMINI IMAGE ENGINE CRITICAL FALLBACK]", error);
    
    // Prevent 500 error on any uncaught initialization error
    const lowerPrompt = prompt ? prompt.toLowerCase() : "";
    let theme = "vibrant";
    if (lowerPrompt.includes("nail") || lowerPrompt.includes("móng")) {
      theme = "nails";
    } else if (lowerPrompt.includes("hair") || lowerPrompt.includes("tóc") || lowerPrompt.includes("gội")) {
      theme = "haircare";
    } else if (lowerPrompt.includes("spa") || lowerPrompt.includes("massage")) {
      theme = "spa";
    }

    const unsplashUrl = `https://images.unsplash.com/photo-1607779097040-26e80b779eef?auto=format&fit=crop&q=80&w=600`;
    const specificUrls: Record<string, string> = {
      nails: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600",
      haircare: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600",
      spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
    };

    const imageUrl = specificUrls[theme] || unsplashUrl;
    return NextResponse.json({ image: imageUrl, method: "STOCK", isFallback: true });
  }
}
