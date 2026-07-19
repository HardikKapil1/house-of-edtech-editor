import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { getPrompt, AiAction } from "@/lib/ai-prompts";

/**
 * Handles AI requests from the editor toolbar.
 * Receives an action and selected text,
 * sends it to Gemini and returns the transformed result.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const action = body.action as AiAction;
    const text = body.text?.trim();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const allowed: AiAction[] = [
      "rewrite",
      "summarize",
      "continue",
      "fix-grammar",
    ];

    if (!allowed.includes(action)) {
      return NextResponse.json(
        { error: "Invalid AI action." },
        { status: 400 },
      );
    }

    const prompt = getPrompt(action, text);

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return NextResponse.json({
      output: result.text?.trim() ?? "",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "AI generation failed." },
      { status: 500 },
    );
  }
}
