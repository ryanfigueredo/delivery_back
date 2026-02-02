/**
 * Webhook do Meta (WhatsApp Cloud API)
 * URL: https://delivery-back-eosin.vercel.app/api/webhook/meta
 * OBRIGATÓRIO na Vercel: WHATSAPP_VERIFY_TOKEN (Settings → Environment Variables)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[Meta Webhook] Verificação falhou:", {
    mode,
    tokenMatch: token === VERIFY_TOKEN,
    hasVerifyToken: !!VERIFY_TOKEN,
  });
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log("[Meta Webhook] POST recebido");
  try {
    const { handler } = await import("@/lib/whatsapp-bot/cloud-api-handler");
    const body = await request.json();
    const entries = body?.entry || [];
    const firstMsg = entries[0]?.changes?.[0]?.value?.messages?.[0];
    console.log(
      "[Meta Webhook] Entries:",
      entries.length,
      "phone_number_id:",
      entries[0]?.changes?.[0]?.value?.metadata?.phone_number_id,
      "msg:",
      firstMsg?.type,
      firstMsg?.text?.body?.substring(0, 30),
    );
    const event = {
      requestContext: { http: { method: "POST" } },
      rawQueryString: "",
      queryStringParameters: null,
      body: JSON.stringify(body),
    };
    const result = await handler(event, {});
    return new NextResponse(result.body ?? "OK", {
      status: result.statusCode ?? 200,
      headers: result.headers ?? { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("[Meta Webhook] POST error:", error);
    return new NextResponse("OK", { status: 200 }); // Meta espera 200 mesmo em erro
  }
}
