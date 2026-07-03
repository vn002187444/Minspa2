import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/utils/auth";
import { FALLBACK_IMAGES as SHARED_FALLBACK_IMAGES } from "@/lib/fallback-images";

