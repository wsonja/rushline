import { NextResponse } from "next/server";
import { hasLLM, llmJSON } from "@/lib/llm";

type Body = {
  question: string;
  pageContext?: string;
};

export async function POST(req: Request) {
  const { question, pageContext } = (await req.json()) as Body;
  const q = (question ?? "").trim();
  if (!q) return NextResponse.json({ text: "Ask something about this page." });

  if (!pageContext) {
    return NextResponse.json({
      text: "I only read what's on the current page. Open a club to ask about the review, roster, or what's missing.",
    });
  }

  if (hasLLM()) {
    const result = await llmJSON<{ text: string; extras?: string[] }>(
      `Question: ${q}\n\nPage context:\n${pageContext.slice(0, 6000)}`,
      `You are rushline's copilot. You may ONLY use the page context. Never invent sources, scores, or people. If something is missing, call it an honest gap and say why. Keep answers short. If you suggest coffee-chat openers, put them in extras as 1–2 quoted lines. Return JSON: {"text": string, "extras"?: string[]}`
    );
    if (result?.text) return NextResponse.json(result);
  }

  const lower = q.toLowerCase();
  if (lower.includes("missing") || lower.includes("gap")) {
    return NextResponse.json({
      text: "What's missing is called out on the page — look for the dashed 'honest gap' panels. We don't backfill a zero or a neutral score when a source didn't return.",
    });
  }
  const snippet = pageContext.slice(0, 420).replace(/\s+/g, " ");
  return NextResponse.json({
    text: `From this page: ${snippet}${pageContext.length > 420 ? "…" : ""}`,
  });
}
