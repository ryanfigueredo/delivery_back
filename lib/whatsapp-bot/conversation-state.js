/**
 * Estado de conversa persistido no DynamoDB (tabela bot-delivery)
 * Usa o atributo conversation_states no item de config (phone_number_id)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
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
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "bot-delivery";

function getUserKey(from) {
  return "u_" + String(from).replace(/\D/g, "");
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
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
      })
    );
    const states = result.Item?.conversation_states || {};
    const key = getUserKey(from);
    const data = states[key];
    if (data && data.estado) {
      return {
        estado: data.estado,
        pedido: data.pedido || ESTADO_INICIO.pedido,
      };
    }
  } catch (e) {
    console.error("[ConversationState] Erro ao carregar:", e.message);
  }
  return { ...ESTADO_INICIO, pedido: { ...ESTADO_INICIO.pedido } };
}

function sanitizePedido(pedido) {
  if (!pedido) return ESTADO_INICIO.pedido;
  const itens = Array.isArray(pedido.itens)
    ? pedido.itens.map((i) => ({
        id: String(i.id ?? ""),
        name: String(i.name ?? ""),
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
      }))
    : [];
  return {
    nome: String(pedido.nome ?? ""),
    telefone: String(pedido.telefone ?? ""),
    itens,
    metodoPagamento: String(pedido.metodoPagamento ?? ""),
    tipoPedido: String(pedido.tipoPedido ?? "restaurante"),
    endereco: String(pedido.endereco ?? ""),
    total: Number(pedido.total) || 0,
  };
}

async function saveConversa(phoneNumberId, from, conversa) {
  try {
    const key = getUserKey(from);
    // Nome de atributo dinâmico: DynamoDB exige ExpressionAttributeNames para paths
    const state = {
      estado: String(conversa.estado ?? "inicio"),
      pedido: sanitizePedido(conversa.pedido),
    };
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
        UpdateExpression: "SET #cs.#uk = :conv",
        ExpressionAttributeNames: {
          "#cs": "conversation_states",
          "#uk": key,
        },
        ExpressionAttributeValues: { ":conv": state },
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
};
