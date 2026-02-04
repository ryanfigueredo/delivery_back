import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { validateApiKey, validateBasicAuth } from "@/lib/auth";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

/**
 * Envia mensagem WhatsApp via Meta Cloud API
 * Usado pelo atendimento (desktop e app) para responder clientes
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let apiValid = false;
    let basicValid = false;
    try {
      const r = await validateApiKey(request);
      apiValid = r.isValid;
    } catch (_) {}
    try {
      const r = await validateBasicAuth(request);
      basicValid = r.isValid;
    } catch (_) {}
    if (!session && !apiValid && !basicValid) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, message } = body;
    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "phone e message são obrigatórios" },
        { status: 400 }
      );
    }

    const token = process.env.TOKEN_API_META;
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: "TOKEN_API_META e PHONE_NUMBER_ID não configurados",
        },
        { status: 500 }
      );
    }

    let whatsappPhone = String(phone).replace(/\D/g, "");
    if (!whatsappPhone.startsWith("55") && whatsappPhone.length >= 10) {
      whatsappPhone = `55${whatsappPhone}`;
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: whatsappPhone,
        type: "text",
        text: { body: String(message).slice(0, 4096) },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[SendWhatsApp] Meta API erro:", res.status, data);
      return NextResponse.json(
        { success: false, error: data?.error?.message || "Erro ao enviar" },
        { status: res.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[SendWhatsApp] Erro:", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
