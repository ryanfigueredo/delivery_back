/**
 * Webhook WhatsApp Cloud API — Oficial da Meta
 * Suporta múltiplos clientes via DynamoDB
 */

const { handleMessageDynamic } = require("./handlers-dynamic");
const {
  handleMessageRestaurante,
  isRestauranteConfig,
} = require("./handlers-restaurante");
const { getClientConfig, isDynamoDBEnabled } = require("./dynamodb");

const fetch = globalThis.fetch;

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || "";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

function getQuery(event) {
  const q = { ...(event.queryStringParameters || {}) };
  const raw = event.rawQueryString || "";
  if (raw && typeof raw === "string") {
    for (const part of raw.split("&")) {
      const [k, v] = part
        .split("=")
        .map((s) => (s ? decodeURIComponent(s) : ""));
      if (k) q[k] = v;
    }
  }
  return q;
}

function parseBody(event) {
  const raw = event.body;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }
  return raw;
}

async function sendWhatsApp(to, text, phoneNumberId, accessToken) {
  if (!accessToken || !phoneNumberId) {
    console.error("[Cloud API] Token ou Phone Number ID ausente");
    return false;
  }

  const phone = String(to).replace(/\D/g, "");
  if (!phone) {
    console.error("[Cloud API] Número de telefone inválido:", to);
    return false;
  }

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
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[Cloud API] Erro ao enviar mensagem:", res.status, err);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[Cloud API] Erro ao enviar mensagem:", e.message);
    return false;
  }
}

function verify(q) {
  const mode = q["hub.mode"];
  const token = q["hub.verify_token"];
  const challenge = q["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    console.log("[Cloud API] Verificação do webhook: OK");
    return { ok: true, body: challenge };
  }

  console.log("[Cloud API] Verificação do webhook: FALHOU", {
    mode,
    tokenMatch: token === VERIFY_TOKEN,
  });
  return { ok: false };
}

async function processWebhook(body) {
  const entries = body?.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const ch of changes) {
      const val = ch?.value || {};
      const messages = val?.messages || [];
      const metadata = val?.metadata || {};
      const phoneNumberId = metadata?.phone_number_id;

      if (!phoneNumberId) {
        console.error("[Cloud API] phone_number_id não encontrado no metadata");
        continue;
      }

      let clientConfig = null;

      if (isDynamoDBEnabled()) {
        clientConfig = await getClientConfig(phoneNumberId);

        if (!clientConfig) {
          console.warn(
            "[Cloud API] phone_number_id não encontrado no DynamoDB:",
            phoneNumberId,
          );
          continue;
        }
      } else {
        console.error("[Cloud API] DynamoDB não está habilitado");
        continue;
      }

      for (const msg of messages) {
        const userNumber = msg?.from;
        const messageText = msg?.text?.body || "";
        const messageType = msg?.type;

        if (messageType !== "text") continue;
        if (!userNumber || !messageText) continue;

        try {
          let result;
          if (isRestauranteConfig(clientConfig)) {
            result = await handleMessageRestaurante(
              userNumber,
              messageText,
              clientConfig,
            );
          } else {
            result = await handleMessageDynamic(
              userNumber,
              messageText,
              null,
              clientConfig,
            );
          }
          const reply = result?.reply;

          if (reply) {
            await sendWhatsApp(
              userNumber,
              reply,
              phoneNumberId,
              clientConfig.token_api_meta,
            );
          }
        } catch (error) {
          console.error(
            "[Cloud API] Erro ao processar mensagem:",
            error.message,
          );
        }
      }
    }
  }
}

async function handler(event, context) {
  const method = (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    "GET"
  ).toUpperCase();
  const q = getQuery(event);

  if (method === "GET") {
    const v = verify(q);
    if (v.ok) {
      return {
        statusCode: 200,
        body: v.body,
        headers: { "Content-Type": "text/plain" },
      };
    }
    return {
      statusCode: 403,
      body: "Forbidden",
      headers: { "Content-Type": "text/plain" },
    };
  }

  if (method === "POST") {
    const body = parseBody(event);
    await processWebhook(body);
    return {
      statusCode: 200,
      body: "OK",
      headers: { "Content-Type": "text/plain" },
    };
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
    headers: { "Content-Type": "text/plain" },
  };
}

module.exports = { handler };
