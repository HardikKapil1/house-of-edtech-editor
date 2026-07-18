// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { getPrompt } from "@/lib/ai-prompts";

export async function POST(request: NextRequest) {
  const { action, text } = await request.json();
  const prompt = getPrompt(action, text);

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return NextResponse.json({
    output: result.text,
  });
}
