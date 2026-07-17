import { NextResponse } from "next/server";

// Turns an upstream AI failure into an honest, actionable message.
// Rate limits and missing keys are the two failures a free tier actually hits,
// and "couldn't understand that" is a lie in both cases.
export function aiErrorResponse(error: unknown, fallback: string) {
  const err = error as { status?: number; message?: string };
  const status = err?.status;
  const message = err?.message ?? "";

  if (!process.env.GROQ_API_KEY) {
    console.error("AI route called without GROQ_API_KEY set");
    return NextResponse.json(
      { error: "AI features aren't configured on this server yet." },
      { status: 503 }
    );
  }

  if (status === 429 || /rate.?limit/i.test(message)) {
    return NextResponse.json(
      { error: "The AI is busy right now — wait a few seconds and try again." },
      { status: 429 }
    );
  }

  if (status === 401 || status === 403) {
    return NextResponse.json(
      { error: "AI service rejected the request. The API key may need renewing." },
      { status: 502 }
    );
  }

  if (status && status >= 500) {
    return NextResponse.json(
      { error: "The AI service is temporarily down. Please try again shortly." },
      { status: 502 }
    );
  }

  console.error("AI error:", error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
