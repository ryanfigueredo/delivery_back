/**
 * Webhook do Meta (WhatsApp Cloud API)
 * URL: https://pedidos-express-api.vercel.app/api/webhook/meta
 * OBRIGATÓRIO na Vercel: WHATSAPP_VERIFY_TOKEN (Settings → Environment Variables)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode =
    params.get("hub.mode") || params.get("hub_mode") || params.get("mode");
  const token =
    params.get("hub.verify_token") ||
    params.get("hub_verify_token") ||
    params.get("verify_token");
  const challenge =
    params.get("hub.challenge") ||
    params.get("hub_challenge") ||
    params.get("challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    console.log("[Meta Webhook] Verificação OK - retornando challenge");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (!mode && !token) {
    console.log("[Meta Webhook] GET sem params (não é verificação Meta)");
  } else {
    console.warn("[Meta Webhook] Verificação falhou:", {
      mode,
      tokenMatch: token === VERIFY_TOKEN,
      hasVerifyToken: !!VERIFY_TOKEN,
    });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  console.log("[Meta Webhook] POST recebido");
  try {
    const body = await request.json();

    // === DEBUG: Log completo do webhook ===
    const phoneNumberId =
      body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    const wabaId = body?.entry?.[0]?.id;
    console.log("[Meta Webhook] DEBUG - JSON completo:", JSON.stringify(body));
    console.log(
      "[Meta Webhook] DEBUG - entry[0].changes[0].value.metadata.phone_number_id:",
      phoneNumberId,
      "| tipo:",
      typeof phoneNumberId
    );
    console.log(
      "[Meta Webhook] DEBUG - entry[0].id (WABA ID):",
      wabaId,
      "| tipo:",
      typeof wabaId
    );
    // === Fim DEBUG ===

    const { handler } = await import("@/lib/whatsapp-bot/cloud-api-handler");
    const entries = body?.entry || [];
    const firstMsg = entries[0]?.changes?.[0]?.value?.messages?.[0];
    console.log(
      "[Meta Webhook] Entries:",
      entries.length,
      "phone_number_id:",
      phoneNumberId,
      "msg:",
      firstMsg?.type,
      firstMsg?.text?.body?.substring(0, 30)
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
