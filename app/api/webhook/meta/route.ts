/**
 * Webhook WhatsApp Cloud API — CÓPIA DO SaaS-RFID (funciona)
 * URL: https://pedidos-express-api.vercel.app/api/webhook/meta
 *
 * Fluxo simples e stateless: oi → menu → cardápio/resumo/atendente
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const runtime = "nodejs";

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

const WELCOME_TRIGGERS = [
  "oi",
  "olá",
  "ola",
  "menu",
  "inicio",
  "início",
  "começar",
  "comecar",
  "bom dia",
  "boa tarde",
  "boa noite",
];

async function sendText(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[Webhook] Erro ao enviar texto:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar:", e);
    return false;
  }
}

async function sendButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone || buttons.length === 0) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText.slice(0, 1024) },
            action: {
              buttons: buttons.slice(0, 3).map((b) => ({
                type: "reply",
                reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) },
              })),
            },
          },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[Webhook] Erro ao enviar botões:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar botões:", e);
    return false;
  }
}

async function sendList(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone || sections.length === 0) return false;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "interactive",
          interactive: {
            type: "list",
            body: { text: bodyText.slice(0, 1024) },
            action: {
              button: buttonText.slice(0, 20) || "Ver Cardápio",
              sections: sections.map((s) => ({
                title: s.title.slice(0, 24),
                rows: s.rows.slice(0, 10).map((r) => ({
                  id: r.id.slice(0, 256),
                  title: r.title.slice(0, 24),
                  description: r.description?.slice(0, 72),
                })),
              })),
            },
          },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[Webhook] Erro ao enviar lista:", res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar lista:", e);
    return false;
  }
}

async function fetchMenu(config: {
  desktop_api_url: string;
  tenant_api_key: string;
}): Promise<
  Array<{ id: string; name: string; price: number; available?: boolean }>
> {
  try {
    const res = await fetch(`${config.desktop_api_url}/api/bot/menu/public`, {
      headers: { "X-API-Key": config.tenant_api_key },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

/** GET: verificação do webhook pela Meta */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN &&
    challenge != null &&
    challenge !== ""
  ) {
    return new NextResponse(String(challenge), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/** POST: eventos do WhatsApp */
export async function POST(request: NextRequest) {
  console.log("[Webhook] POST recebido em", new Date().toISOString());

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[Webhook] Erro ao parsear body:", e);
    return new NextResponse("OK", { status: 200 });
  }

  const entries = (body?.entry as Array<Record<string, unknown>>) || [];

  for (const entry of entries) {
    const entryChanges =
      (entry?.changes as Array<Record<string, unknown>>) || [];

    for (const ch of entryChanges) {
      const val = (ch?.value as Record<string, unknown>) || {};
      const messages = (val?.messages as Array<Record<string, unknown>>) || [];
      const metadata = (val?.metadata as Record<string, unknown>) || {};
      const phoneNumberIdRaw = metadata?.phone_number_id;
      const phoneNumberId =
        phoneNumberIdRaw != null ? String(phoneNumberIdRaw) : undefined;

      if (!phoneNumberId) continue;

      // Busca config no DynamoDB (bot-delivery)
      const {
        getClientConfig,
        getClientConfigByBusinessAccountId,
        isDynamoDBEnabled,
      } = await import("@/lib/whatsapp-bot/dynamodb");

      let clientConfig: {
        nome_do_cliente: string;
        token_api_meta: string;
        desktop_api_url: string;
        tenant_api_key: string;
      } | null = null;

      if (isDynamoDBEnabled()) {
        clientConfig = await getClientConfig(phoneNumberId);
        if (!clientConfig && entry?.id) {
          const byWaba = await getClientConfigByBusinessAccountId(
            String(entry.id),
            phoneNumberId
          );
          if (byWaba) clientConfig = byWaba;
        }
      }

      if (!clientConfig?.token_api_meta) {
        console.error("[Webhook] Config não encontrada para", phoneNumberId);
        continue;
      }

      const nomeRestaurante = clientConfig.nome_do_cliente || "Pedidos Express";

      for (const msg of messages) {
        const from = msg?.from as string | undefined;
        const messageType = msg?.type as string | undefined;

        if (!from) continue;

        let messageText = "";
        let isInteractive = false;
        let interactiveId = "";
        let interactiveTitle = "";

        if (messageType === "text") {
          const textObj = msg?.text as { body?: string } | undefined;
          messageText = textObj?.body || "";
        } else if (messageType === "interactive") {
          isInteractive = true;
          const interactive = msg?.interactive as
            | Record<string, unknown>
            | undefined;
          const buttonReply = interactive?.button_reply as
            | { id?: string; title?: string }
            | undefined;
          const listReply = interactive?.list_reply as
            | { id?: string; title?: string }
            | undefined;
          if (buttonReply) {
            interactiveId = String(buttonReply.id || "");
            interactiveTitle = String(buttonReply.title || "");
          } else if (listReply) {
            interactiveId = String(listReply.id || "");
            interactiveTitle = String(listReply.title || "");
          }
          messageText = interactiveTitle || interactiveId;
        }

        if (!messageText && !isInteractive) continue;

        const msgTrim = messageText.trim().toLowerCase();
        const hora = new Date().getHours();
        const saudacao =
          hora >= 18 ? "Boa noite" : hora >= 12 ? "Boa tarde" : "Bom dia";

        // Welcome (oi, olá, menu...)
        const isWelcome = WELCOME_TRIGGERS.some(
          (t) => msgTrim === t || msgTrim.includes(t)
        );
        if (isWelcome) {
          const bodyText = `*${nomeRestaurante}*\n\n${saudacao}! 👋\n\nEscolha uma opção abaixo:`;
          await sendButtons(
            from,
            bodyText,
            [
              { id: "cardapio", title: "📋 Cardápio" },
              { id: "resumo", title: "🛒 Resumo" },
              { id: "atendente", title: "👤 Atendente" },
            ],
            phoneNumberId,
            clientConfig.token_api_meta
          );
          continue;
        }

        // Cardápio (botão ou texto)
        const isCardapio =
          msgTrim === "cardapio" ||
          msgTrim === "cardápio" ||
          msgTrim === "1" ||
          interactiveId === "cardapio";
        if (isCardapio) {
          const items = await fetchMenu(clientConfig);
          const hamburgueres = items.filter(
            (i) =>
              (i.id || "").includes("hamburguer") ||
              (i.name || "").toLowerCase().includes("hambúrguer")
          );
          const bebidas = items.filter(
            (i) =>
              (i.id || "").includes("refrigerante") ||
              (i.id || "").includes("suco") ||
              (i.id || "").includes("agua") ||
              (i.name || "").toLowerCase().includes("bebida")
          );
          if (hamburgueres.length === 0 && bebidas.length === 0) {
            const fallback = [
              {
                id: "hamburguer_simples",
                name: "Hambúrguer Simples",
                price: 18,
              },
              { id: "refrigerante", name: "Refrigerante", price: 5 },
            ];
            hamburgueres.push(fallback[0]);
            bebidas.push(fallback[1]);
          }
          const sections = [];
          if (hamburgueres.length > 0) {
            sections.push({
              title: "🍔 Hambúrgueres",
              rows: hamburgueres.map((h) => ({
                id: h.id,
                title: h.name.slice(0, 24),
                description: `R$ ${Number(h.price)
                  .toFixed(2)
                  .replace(".", ",")}`,
              })),
            });
          }
          if (bebidas.length > 0) {
            sections.push({
              title: "🥤 Bebidas",
              rows: bebidas.map((b) => ({
                id: b.id,
                title: b.name.slice(0, 24),
                description: `R$ ${Number(b.price)
                  .toFixed(2)
                  .replace(".", ",")}`,
              })),
            });
          }
          if (sections.length > 0) {
            await sendList(
              from,
              `*${nomeRestaurante}*\n\n📋 Escolha um item do cardápio:`,
              "Ver Cardápio",
              sections,
              phoneNumberId,
              clientConfig.token_api_meta
            );
          } else {
            await sendText(
              from,
              `*${nomeRestaurante}*\n\nCardápio em breve. Entre em contato!`,
              phoneNumberId,
              clientConfig.token_api_meta
            );
          }
          continue;
        }

        // Resumo
        const isResumo =
          msgTrim === "resumo" || msgTrim === "2" || interactiveId === "resumo";
        if (isResumo) {
          await sendText(
            from,
            `*${nomeRestaurante}*\n\n🛒 Você ainda não tem itens no pedido.\n\nDigite *1* ou *Cardápio* para ver o menu.`,
            phoneNumberId,
            clientConfig.token_api_meta
          );
          continue;
        }

        // Atendente
        const isAtendente =
          msgTrim === "atendente" ||
          msgTrim.includes("atendente") ||
          msgTrim === "3" ||
          interactiveId === "atendente";
        if (isAtendente) {
          await sendText(
            from,
            `*${nomeRestaurante}*\n\n👋 Um atendente vai te responder em breve.\n\nEnquanto isso, você pode continuar fazendo seu pedido! 😊`,
            phoneNumberId,
            clientConfig.token_api_meta
          );
          continue;
        }

        // Fallback
        await sendText(
          from,
          `*${nomeRestaurante}*\n\n${saudacao}! 👋\n\n*Escolha:*\n1️⃣ Cardápio\n2️⃣ Resumo\n3️⃣ Atendente\n\nOu digite *oi* para começar.`,
          phoneNumberId,
          clientConfig.token_api_meta
        );
      }
    }
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
