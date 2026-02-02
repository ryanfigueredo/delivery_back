/**
 * Estado de conversa persistido no DynamoDB (Vercel serverless perde memória entre requests)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME =
  process.env.DYNAMODB_CONVERSATION_STATE_TABLE || "bot-conversation-state";

function getConversationId(phoneNumberId, from) {
  return `${phoneNumberId}:${String(from).replace(/\D/g, "")}`;
}

const ESTADO_INICIO = {
  estado: "inicio",
  pedido: {
    nome: "",
    telefone: "",
    itens: [],
    metodoPagamento: "",
    tipoPedido: "restaurante",
    endereco: "",
    total: 0,
  },
};

async function loadConversa(phoneNumberId, from) {
  try {
    const id = getConversationId(phoneNumberId, from);
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { conversation_id: id },
      })
    );
    if (result.Item && result.Item.estado) {
      return {
        estado: result.Item.estado,
        pedido: result.Item.pedido || ESTADO_INICIO.pedido,
      };
    }
  } catch (e) {
    console.error("[ConversationState] Erro ao carregar:", e.message);
  }
  return { ...ESTADO_INICIO, pedido: { ...ESTADO_INICIO.pedido } };
}

async function saveConversa(phoneNumberId, from, conversa) {
  try {
    const id = getConversationId(phoneNumberId, from);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          conversation_id: id,
          estado: conversa.estado,
          pedido: conversa.pedido,
          updated_at: new Date().toISOString(),
        },
      })
    );
  } catch (e) {
    console.error("[ConversationState] Erro ao salvar:", e.message);
  }
}

module.exports = {
  loadConversa,
  saveConversa,
  ESTADO_INICIO,
  TABLE_NAME,
};
