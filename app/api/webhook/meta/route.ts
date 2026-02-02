/**
 * Webhook do Meta (WhatsApp Cloud API)
 * Recebe mensagens e eventos do WhatsApp diretamente na Vercel.
 * URL de callback no Meta: https://delivery-back-eosin.vercel.app/api/webhook/meta
 * Verificar token: WHATSAPP_VERIFY_TOKEN (env)
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { handler } = await import("@/lib/whatsapp-bot/cloud-api-handler");
    const q = Object.fromEntries(request.nextUrl.searchParams);
    const event = {
      requestContext: { http: { method: "GET" } },
      rawQueryString: request.nextUrl.searchParams.toString(),
      queryStringParameters: Object.keys(q).length ? q : null,
    };
    const result = await handler(event, {});
    return new NextResponse(result.body ?? "", {
      status: result.statusCode ?? 200,
      headers: result.headers ?? { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("[Meta Webhook] GET verify error:", error);
    return new NextResponse("Forbidden", { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { handler } = await import("@/lib/whatsapp-bot/cloud-api-handler");
    const body = await request.json();
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
