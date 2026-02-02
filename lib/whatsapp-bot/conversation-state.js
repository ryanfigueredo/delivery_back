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

async function saveConversa(phoneNumberId, from, conversa) {
  try {
    const key = getUserKey(from);
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { phone_number_id: String(phoneNumberId) },
        UpdateExpression:
          "SET conversation_states = if_not_exists(conversation_states, :empty), conversation_states.#k = :conv",
        ExpressionAttributeNames: { "#k": key },
        ExpressionAttributeValues: {
          ":empty": {},
          ":conv": {
            estado: conversa.estado,
            pedido: conversa.pedido,
          },
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
};
