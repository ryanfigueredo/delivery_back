/**
 * Webhook WhatsApp Cloud API — Tamboril Burguer
 * URL: https://pedidos-express-api.vercel.app/api/bot/webhook
 *
 * PRIORIDADE DE RESPOSTA: Retorna 200 OK IMEDIATAMENTE após receber o body,
 * para a Meta não retryar (evita mensagens duplicadas). O processamento roda
 * em background (fire-and-forget).
 *
 * Fluxo Restaurante (tenant_api_key presente):
 *   oi → Cardápio/Resumo/Atendente → menu dinâmico → pedido → Order no banco
 *
 * Fluxo simples (fallback): welcome → Lista Cardápio/Resumo/Atendente
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsAppClientConfig,
  isWhatsAppDynamoEnabled,
  type WhatsAppClientConfig,
  type BotOption,
} from "@/lib/whatsapp-dynamodb";

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
  "olaa",
  "inicio",
  "início",
  "começar",
  "comecar",
  "bom dia",
  "boa tarde",
  "boa noite",
];

function getOptionResponse(
  opt: BotOption,
  config: WhatsAppClientConfig
): string {
  if (opt.type === "custom" && opt.response?.trim()) return opt.response.trim();
  if (opt.type === "support") {
    return (
      config.support_message?.trim() ||
      "Em instantes um atendente vai responder. Aguarde!"
    );
  }
  if (opt.label?.includes("Cardápio")) {
    return "📋 Carregando cardápio... (em breve)";
  }
  if (opt.label?.includes("Resumo")) {
    return "🛒 Você ainda não tem itens no pedido. Digite 1 ou Cardápio para ver o menu.";
  }
  return (
    config.order_message?.trim() ||
    "Registrei seu pedido. Em instantes alguém vai responder."
  );
}

async function sendTextMessage(
  to: string,
  text: string,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone) return false;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  console.log("[Meta API] Número destino (wa_id, só dígitos):", phone, "| len:", phone.length);
  const tokenPreview = accessToken
    ? `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`
    : "(vazio)";
  console.log("[Meta API] Enviando para URL:", url);
  console.log("[Meta API] Token (4 primeiros + 4 últimos):", tokenPreview);
  try {
    const res = await fetch(url, {
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
    });
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendTextMessage:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar texto:",
        res.status,
        resData,
        "| to:",
        phone
      );
      return false;
    }
    console.log("[Webhook] Texto enviado OK para", phone);
    return true;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[Meta API] Erro de Rede:", err.message);
    console.error("[Webhook] Erro ao enviar texto:", e);
    return false;
  }
}

/** Envia List Message estilo RFID - botão "Opções" que abre lista */
async function sendListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  options: BotOption[],
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const phone = String(to).replace(/\D/g, "");
  if (!phone || options.length === 0) return false;

  const rows = options.slice(0, 10).map((opt, i) => ({
    id: `opt_${i}`,
    title: (opt.label || `Opção ${i + 1}`).slice(0, 24),
    description:
      opt.type === "order"
        ? "Registrar pedido"
        : opt.type === "support"
        ? "Falar com atendente"
        : "",
  }));

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
              button: buttonText.slice(0, 20) || "Opções",
              sections: [{ title: "Escolha uma opção", rows }],
            },
          },
        }),
      }
    );
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendListMessage:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar List Message:",
        res.status,
        resData,
        "| to:",
        phone
      );
      return false;
    }
    console.log("[Webhook] List enviada OK para", phone);
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar List:", e);
    return false;
  }
}

/** Envia mensagem interativa (botões ou lista) - usado pelo handlers-restaurante */
async function sendInteractive(
  to: string,
  payload: Record<string, unknown>,
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
          type: "interactive",
          interactive: payload,
        }),
      }
    );
    const resData = await res.text();
    console.log(
      "[Meta API] Resposta sendInteractive:",
      res.status,
      resData?.slice(0, 200) || ""
    );
    if (!res.ok) {
      console.error(
        "[Webhook] Erro ao enviar interativo:",
        res.status,
        resData
      );
      return false;
    }
    console.log("[Webhook] Interativo enviado OK para", phone);
    return true;
  } catch (e) {
    console.error("[Webhook] Erro ao enviar interativo:", e);
    return false;
  }
}

function isRestauranteConfig(config: WhatsAppClientConfig): boolean {
  return !!(config.tenant_api_key && config.desktop_api_url);
}

function resolveTextReply(
  messageText: string,
  config: WhatsAppClientConfig
): { text: string; sendList?: boolean } {
  const msg = messageText.trim().toLowerCase();
  const welcomeMsg =
    config.welcome_message?.trim() ||
    `Olá! Você está falando com o ${
      config.nome_do_cliente || "Tamboril Burguer"
    }. Como posso ajudar?`;
  const fallbackMsg =
    config.fallback_message?.trim() ||
    "Digite o número da opção ou o que deseja.";

  if (WELCOME_TRIGGERS.some((t) => msg.includes(t) || msg === t)) {
    const options = config.options || [];
    if (options.length > 0) {
      return { text: welcomeMsg, sendList: true };
    }
    return { text: welcomeMsg };
  }

  const options = config.options || [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const num = String(i + 1);
    const label = (opt.label || "").toLowerCase();
    const keywords = opt.keywords || [];
    const matchNum = msg === num || msg === num + ".";
    const matchLabel = label && msg.includes(label.replace(/[^\w\s]/g, ""));
    const matchKeyword = keywords.some((k) => msg.includes(k.toLowerCase()));
    if (matchNum || matchLabel || matchKeyword) {
      return { text: getOptionResponse(opt, config) };
    }
  }

  return { text: fallbackMsg };
}

function resolveInteractiveReply(
  selectedId: string,
  selectedTitle: string,
  config: WhatsAppClientConfig
): string {
  const options = config.options || [];
  const match = selectedId.match(/^opt_(\d+)$/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (idx >= 0 && idx < options.length) {
      return getOptionResponse(options[idx], config);
    }
  }
  for (const opt of options) {
    if ((opt.label || "").toLowerCase().includes(selectedTitle.toLowerCase())) {
      return getOptionResponse(opt, config);
    }
  }
  return (
    config.order_message?.trim() ||
    "Registrei seu pedido. Em instantes alguém vai responder."
  );
}

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

  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString();
  console.log("[Webhook] POST recebido em", receivedAt);
  console.log("Variável Table Name:", process.env.DYNAMODB_TABLE_NAME);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
    const bodyStr = JSON.stringify(body);
    console.log(
      "[Webhook] Body recebido:",
      bodyStr.length > 2000 ? bodyStr.slice(0, 2000) + "..." : bodyStr
    );
  } catch (e) {
    console.error("[Webhook] Erro ao parsear body:", e);
    return new NextResponse("OK", { status: 200 });
  }

  const hasAws =
    !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    !!(
      process.env.DYNAMODB_AWS_ACCESS_KEY_ID &&
      process.env.DYNAMODB_AWS_SECRET_ACCESS_KEY
    );
  const tableName = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";
  console.log("[Webhook] DynamoDB:", {
    hasCredentials: hasAws,
    table: tableName,
    region:
      process.env.DYNAMODB_AWS_REGION || process.env.AWS_REGION || "us-east-1",
  });

  // PRIORIDADE: responder 200 OK imediatamente para a Meta não retryar
  const entries = (body?.entry as Array<Record<string, unknown>>) || [];
  if (entries.length > 0) {
    void processWebhookPayload(body).catch((e) => {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[Webhook] Erro no processamento assíncrono:", err.message);
      console.error("[Webhook] Stack:", err.stack);
    });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

function buildFallbackConfig(phoneNumberId: string): WhatsAppClientConfig {
  const token = process.env.TOKEN_API_META || "";
  const desktopUrl =
    process.env.DESKTOP_API_URL ||
    process.env.VERCEL_URL ||
    "https://pedidos-express-api.vercel.app";
  return {
    nome_do_cliente: process.env.NOME_DO_CLIENTE || "Tamboril Burguer",
    token_api_meta: token,
    phone_number_id: phoneNumberId,
    tenant_api_key: process.env.TENANT_API_KEY || "fallback",
    desktop_api_url: desktopUrl,
    enabled: true,
  };
}

async function processWebhookPayload(body: Record<string, unknown>) {
  console.log("[Webhook] processWebhookPayload iniciado, entries:", (body?.entry as unknown[])?.length ?? 0);
  try {
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

      let clientConfig: WhatsAppClientConfig | null = null;
      try {
        if (isWhatsAppDynamoEnabled()) {
          console.log("[Webhook] Buscando config DynamoDB para phoneNumberId:", phoneNumberId);
          clientConfig = await getWhatsAppClientConfig(phoneNumberId);
          console.log("[Webhook] getWhatsAppClientConfig retornou, config:", !!clientConfig);
        }
      } catch (e) {
        console.error("[Webhook] Erro ao buscar config:", e);
      }

      console.log("[Webhook] Config encontrada:", !!clientConfig, "| phoneNumberId:", phoneNumberId);

      if (!clientConfig) {
        const fallbackToken = process.env.TOKEN_API_META;
        if (fallbackToken) {
          console.log("[Webhook] Usando fallback de env (TOKEN_API_META)");
          clientConfig = buildFallbackConfig(phoneNumberId);
        } else {
          console.error("[Webhook] Config não encontrada e sem TOKEN_API_META. phoneNumberId:", phoneNumberId);
          continue;
        }
      }
      if (clientConfig.enabled === false) continue;

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
        } else if (messageType === "interactive" || messageType === "button") {
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
          messageText = interactiveTitle;
        }

        if (!messageText && !isInteractive) continue;

        console.log(
          "[Webhook] from:",
          from,
          "type:",
          messageType,
          "text:",
          messageText?.slice(0, 30),
          "phone_number_id:",
          phoneNumberId
        );

        // Fluxo Restaurante (Tamboril): cardápio dinâmico, pedidos, Order no banco
        const isRestaurante = isRestauranteConfig(clientConfig);
        console.log(
          "[Webhook] isRestauranteConfig:",
          isRestaurante,
          "| tenant_api_key:",
          !!clientConfig?.tenant_api_key,
          "| desktop_api_url:",
          clientConfig?.desktop_api_url?.slice(0, 50)
        );
        if (isRestaurante) {
          try {
            const {
              handleMessageRestaurante,
            } = require("@/lib/whatsapp-bot/handlers-restaurante");
            const config = {
              ...clientConfig,
              phone_number_id: clientConfig.phone_number_id || phoneNumberId,
            };
            // Mapear opt_0/1/2 da lista inicial -> cardapio/resumo/atendente.
            // Botões de hambúrguer (id 1,2,3,4 ou título "Bovino Simples", etc): usar TÍTULO
            // para o handler fazer match por nome e evitar confusão com menu inicial (1=cardápio, 3=atendente).
            let textForHandler = messageText;
            const titleLower = (interactiveTitle || "").toLowerCase();
            if (isInteractive) {
              if (
                titleLower.includes("cardápio") ||
                titleLower.includes("cardapio")
              )
                textForHandler = "cardapio";
              else if (titleLower.includes("resumo")) textForHandler = "resumo";
              else if (titleLower.includes("atendente"))
                textForHandler = "atendente";
              else if (interactiveId === "opt_0") textForHandler = "cardapio";
              else if (interactiveId === "opt_1") textForHandler = "resumo";
              else if (interactiveId === "opt_2") textForHandler = "atendente";
              else if (interactiveId === "voltar") textForHandler = "voltar";
              else if (interactiveId === "upsell_sim") textForHandler = "sim";
              else if (interactiveId === "upsell_nao") textForHandler = "nao";
              else if (
                interactiveId &&
                !interactiveId.startsWith("opt_") &&
                /^[1-9]\d*$/.test(interactiveId) &&
                interactiveTitle
              )
                // Botão de item (1,2,3,4): passar TÍTULO para o handler (ex: "Bovino Simples")
                textForHandler = interactiveTitle;
              else if (interactiveId && !interactiveId.startsWith("opt_"))
                textForHandler = interactiveId;
            }
            console.log(
              "[Webhook] Chamando handler | textForHandler:",
              textForHandler,
              "| from:",
              from
            );
            const result = await handleMessageRestaurante(
              from,
              textForHandler,
              config
            );
            console.log(
              "[Handler] Resultado:",
              JSON.stringify(result, null, 2)?.slice(0, 500) || result
            );
            if (result?.interactive) {
              await sendInteractive(
                from,
                result.interactive as Record<string, unknown>,
                phoneNumberId,
                clientConfig.token_api_meta
              );
            } else if (result?.reply) {
              await sendTextMessage(
                from,
                result.reply,
                phoneNumberId,
                clientConfig.token_api_meta
              );
            }
          } catch (err) {
            console.error("[Webhook] Erro handlers-restaurante:", err);
            await sendTextMessage(
              from,
              "❌ Ocorreu um erro. Tente novamente em instantes.",
              phoneNumberId,
              clientConfig.token_api_meta
            );
          }
          continue;
        }

        // Fluxo simples (fallback)
        if (isInteractive && interactiveId) {
          const reply = resolveInteractiveReply(
            interactiveId,
            interactiveTitle,
            clientConfig
          );
          await sendTextMessage(
            from,
            reply,
            phoneNumberId,
            clientConfig.token_api_meta
          );
          continue;
        }

        const { text, sendList } = resolveTextReply(messageText, clientConfig);
        await sendTextMessage(
          from,
          text,
          phoneNumberId,
          clientConfig.token_api_meta
        );

        if (sendList && (clientConfig.options || []).length > 0) {
          const listBody =
            "Como posso ajudar? Toque no botão abaixo para escolher:";
          await sendListMessage(
            from,
            listBody,
            "Opções",
            clientConfig.options || [],
            phoneNumberId,
            clientConfig.token_api_meta
          );
        }
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[Webhook] processWebhookPayload ERRO:", error.message);
    console.error("[Webhook] Stack:", error.stack);
    throw err;
  }
}
