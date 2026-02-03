/**
 * Handler de Restaurantes - WhatsApp Cloud API (Meta Oficial)
 * Estado persistido no DynamoDB (Vercel serverless perde memória entre requests)
 */

const { marcarComoPrioridade } = require("./prioridade-conversas");
const {
  loadConversa,
  saveConversa,
  ESTADO_INICIO,
} = require("./conversation-state");

const fetch = globalThis.fetch;

const ESTADO = {
  INICIO: "inicio",
  CARDAPIO: "cardapio",
  AGUARDANDO_QUANTIDADE: "aguardando_quantidade",
  OFFER_UPSELL: "offer_upsell",
  ESCOLHER_BEBIDA: "escolher_bebida",
  QUANTIDADE_BEBIDA: "quantidade_bebida",
  TIPO_PEDIDO: "tipo_pedido",
  ENDERECO_DELIVERY: "endereco_delivery",
  NOME_CLIENTE: "nome_cliente",
  METODO_PAGAMENTO: "metodo_pagamento",
};

const BATATA_FRITA = {
  id: "batata_frita",
  name: "Porção de Batata Frita",
  price: 10,
};

async function clearConversa(phoneNumberId, from, conversa) {
  if (conversa) {
    conversa.estado = ESTADO.INICIO;
    conversa.pedido = { ...ESTADO_INICIO.pedido };
  }
  return saveConversa(phoneNumberId, from, conversa || ESTADO_INICIO);
}

function ensureHttpsUrl(url) {
  const s = (url || "").trim();
  if (!s) return "https://pedidos.dmtn.com.br";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://${s}`;
}

const MENU_HARDCODED_EMERGENCIA = [
  {
    id: "hamburguer_bovino_simples",
    name: "Hambúrguer Bovino Simples",
    price: 18,
    available: true,
    category: "hamburguer",
  },
  {
    id: "hamburguer_bovino_duplo",
    name: "Hambúrguer Bovino Duplo",
    price: 28,
    available: true,
    category: "hamburguer",
  },
  {
    id: "hamburguer_suino_simples",
    name: "Hambúrguer Suíno Simples",
    price: 20,
    available: true,
    category: "hamburguer",
  },
  {
    id: "hamburguer_suino_duplo",
    name: "Hambúrguer Suíno Duplo",
    price: 30,
    available: true,
    category: "hamburguer",
  },
  {
    id: "refrigerante_coca",
    name: "Coca-Cola",
    price: 5,
    available: true,
    category: "bebida",
  },
  {
    id: "refrigerante_pepsi",
    name: "Pepsi",
    price: 5,
    available: true,
    category: "bebida",
  },
  {
    id: "refrigerante_guarana",
    name: "Guaraná",
    price: 5,
    available: true,
    category: "bebida",
  },
  {
    id: "refrigerante_fanta",
    name: "Fanta",
    price: 5,
    available: true,
    category: "bebida",
  },
  {
    id: "suco_laranja",
    name: "Suco de Laranja",
    price: 6,
    available: true,
    category: "bebida",
  },
  {
    id: "suco_maracuja",
    name: "Suco de Maracujá",
    price: 6,
    available: true,
    category: "bebida",
  },
  {
    id: "suco_limao",
    name: "Suco de Limão",
    price: 6,
    available: true,
    category: "bebida",
  },
  {
    id: "suco_abacaxi",
    name: "Suco de Abacaxi",
    price: 6,
    available: true,
    category: "bebida",
  },
  { id: "agua", name: "Água", price: 3, available: true, category: "bebida" },
  {
    id: "batata_frita",
    name: "Porção de Batata Frita",
    price: 10,
    available: true,
    category: "acompanhamento",
  },
];

/** Menu fixo - sem fetch externo (elimina 401, timeout, etc). */
async function fetchMenu() {
  return MENU_HARDCODED_EMERGENCIA;
}

async function fetchStoreStatus(config) {
  const base = ensureHttpsUrl(config.desktop_api_url);
  const url = `${base.replace(/\/$/, "")}/api/store/status`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { isOpen: true };
    const data = await res.json();
    return {
      isOpen: data.isOpen !== false,
      nextOpenTime: data.nextOpenTime,
      message: data.message,
    };
  } catch (e) {
    console.error("[Restaurante] Erro ao buscar status:", e.message);
    return { isOpen: true };
  }
}

/** Hora atual no fuso de Brasília (GMT-3). */
function getHoraBrasilia() {
  const str = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(str, 10) || 0;
}

/** Saudação (Bom dia / Boa tarde / Boa noite) conforme horário de Brasília. */
function getSaudacaoBrasilia() {
  const hora = getHoraBrasilia();
  return hora >= 18 ? "Boa noite" : hora >= 12 ? "Boa tarde" : "Bom dia";
}

function getMensagemLojaFechada(status) {
  let msg = `🚫 *LOJA FECHADA*\n\n`;
  if (status.nextOpenTime) {
    msg += `A loja está fechada e irá abrir a partir das *${status.nextOpenTime}*.\n\n`;
  } else {
    msg += `A loja está fechada no momento.\n\n`;
  }
  if (status.message) msg += `${status.message}\n\n`;
  msg += `Obrigado! Volte em breve. 👋`;
  return msg;
}

function buildPrecosFromMenu(items) {
  const precos = {};
  const estoque = {};
  (items || []).forEach((item) => {
    precos[item.id] = Number(item.price) || 0;
    estoque[item.id] = item.available !== false;
  });
  return { precos, estoque };
}

function getNomeItem(itemId, items) {
  const item = (items || []).find((i) => i.id === itemId);
  return item ? item.name : itemId;
}

/** Título curto para botão (máx 20 caracteres). */
function tituloBotaoHamburguer(name) {
  const s = (name || "").replace(/^Hambúrguer\s+/i, "").trim();
  return s.length > 20 ? s.slice(0, 17) + "..." : s;
}

/** Cardápio em List Message: botão "Ver Cardápio" que abre lista com todos os hambúrgueres. */
function sendCardapioList(nomeRestaurante, hamburgueresDisp) {
  const rows = (hamburgueresDisp || []).slice(0, 10).map((h, i) => {
    const title = (h.name || `Item ${i + 1}`).slice(0, 24);
    const price = Number(h.price) || 0;
    const desc = `R$ ${price.toFixed(2).replace(".", ",")}`;
    return {
      id: (h.id || `item_${i + 1}`).slice(0, 200),
      title,
      description: desc.slice(0, 72),
    };
  });
  const bodyText = `*${nomeRestaurante}*\n\n🍔 *Faça seu pedido!*\n\nToque no botão abaixo para ver nossos hambúrgueres.`;
  return {
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: "Ver Cardápio",
        sections: [{ title: "Nossos Hambúrgueres", rows }],
      },
    },
  };
}

/** Cardápio: 2 hambúrgueres em botões + botão Voltar; 3º e 4º no texto (digite 3/4). */
function sendCardapioHamburguerButtons(nomeRestaurante, hamburgueresDisp) {
  const lista = hamburgueresDisp.slice(0, 2);
  const temTerceiro = hamburgueresDisp.length >= 3;
  const temQuarto = hamburgueresDisp.length >= 4;
  let body = `*${nomeRestaurante}*\n\n*Faça seu pedido!*\n\nEscolha seu hambúrguer:\n\n`;
  body += `1. ${lista[0]?.name || ""} — R$ ${
    lista[0] ? Number(lista[0].price).toFixed(2).replace(".", ",") : ""
  }\n`;
  if (lista[1])
    body += `2. ${lista[1].name} — R$ ${Number(lista[1].price)
      .toFixed(2)
      .replace(".", ",")}\n`;
  if (temTerceiro)
    body += `\n3. ${hamburgueresDisp[2].name} — R$ ${Number(
      hamburgueresDisp[2].price
    )
      .toFixed(2)
      .replace(".", ",")} (digite 3)\n`;
  if (temQuarto)
    body += `4. ${hamburgueresDisp[3].name} — R$ ${Number(
      hamburgueresDisp[3].price
    )
      .toFixed(2)
      .replace(".", ",")} (digite 4)\n`;

  const buttons = [
    ...lista.map((h, i) => ({
      type: "reply",
      reply: { id: String(i + 1), title: tituloBotaoHamburguer(h.name) },
    })),
    { type: "reply", reply: { id: "voltar", title: "Voltar" } },
  ];
  return {
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons },
    },
  };
}

function itemDisponivel(itemId, estoque) {
  return estoque[itemId] !== false;
}

function getResumoPedido(conversa) {
  if (conversa.pedido.itens.length === 0)
    return (
      "🛒 *Seu pedido está vazio*\n\n" +
      "Que tal dar uma olhada no cardápio? 😋\n\n" +
      "Toque em *📋 Cardápio* ou digite *Cardápio* para ver nossas opções!"
    );
  let resumo = "🛒 *RESUMO DO SEU PEDIDO*\n";
  resumo += "━━━━━━━━━━━━━━━━━━━━\n\n";
  let total = 0;
  conversa.pedido.itens.forEach((item, i) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    resumo += `${i + 1}. ${item.quantity}x ${item.name}\n   R$ ${itemTotal
      .toFixed(2)
      .replace(".", ",")}\n`;
  });
  resumo += "\n━━━━━━━━━━━━━━━━━━━━\n";
  resumo += `💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*`;
  return resumo;
}

/** Resumo compacto do carrinho (ex: antes de pedir endereço de entrega). Nunca lança erro. */
function gerarResumoPedido(conversa) {
  try {
    if (!conversa?.pedido?.itens?.length) return "🛒 *Seu carrinho está vazio*";
    const itens = Array.isArray(conversa.pedido.itens)
      ? conversa.pedido.itens
      : [];
    let msg = "🛒 *SEU CARRINHO:*\n";
    let total = 0;
    for (const item of itens) {
      const qty = Number(item?.quantity) || 1;
      const price = Number(item?.price) || 0;
      const name = String(item?.name ?? "Item").trim() || "Item";
      const itemTotal = qty * price;
      total += itemTotal;
      msg += `${qty}x ${name} - R$ ${itemTotal.toFixed(2).replace(".", ",")}\n`;
    }
    msg += "---\n";
    msg += `*Total: R$ ${total.toFixed(2).replace(".", ",")}*`;
    return msg;
  } catch (e) {
    console.error("[Restaurante] gerarResumoPedido falhou:", e?.message);
    return "🛒 *Resumo do pedido* (confira os itens no carrinho)";
  }
}

function querVoltar(text) {
  const t = (text || "").toLowerCase().trim();
  return (
    t === "voltar" ||
    t === "volta" ||
    t === "v" ||
    t.includes("voltar") ||
    t === "0"
  );
}

function processarMetodoPagamento(escolha) {
  const t = (escolha || "").toLowerCase().trim();
  if (t.includes("1") || t.includes("dinheiro") || t.includes("din"))
    return "Dinheiro";
  if (t.includes("2") || t.includes("pix")) return "PIX";
  if (t.includes("3") || t.includes("cartao") || t.includes("card"))
    return "Cartão";
  if (t.includes("4") || t.includes("voltar")) return "VOLTAR";
  return null;
}

async function finalizarPedidoWebhook(conversa, config) {
  let total = 0;
  conversa.pedido.itens.forEach((item) => {
    total += item.price * item.quantity;
  });
  conversa.pedido.total = total;

  const payload = {
    tenant_id: config.tenant_slug,
    customer_name:
      conversa.pedido.nome || `Cliente ${conversa.pedido.telefone}`,
    customer_phone: conversa.pedido.telefone,
    items: conversa.pedido.itens.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
    })),
    total_price: total,
    payment_method: conversa.pedido.metodoPagamento,
    order_type: conversa.pedido.tipoPedido || "restaurante",
    delivery_address: conversa.pedido.endereco || null,
  };

  const base = ensureHttpsUrl(config.desktop_api_url);
  const url = `${base.replace(/\/$/, "")}/api/webhook/whatsapp`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.tenant_api_key,
      "X-Tenant-Id": config.tenant_slug,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch (_) {
    return { success: false, error: "Resposta inválida da API" };
  }

  if (res.ok && result.success) {
    const orderIdDisplay =
      result.display_id ||
      (result.daily_sequence
        ? `#${String(result.daily_sequence).padStart(3, "0")}`
        : "");
    const sequenceInfo = result.daily_sequence
      ? `\n📍 *Posição na fila:* ${result.daily_sequence}º pedido do dia`
      : "";
    const customerOrdersInfo = result.customer_total_orders
      ? `\n🎉 *Este é seu ${result.customer_total_orders}º pedido!*`
      : "";
    const tipoPedidoEmoji =
      conversa.pedido.tipoPedido === "delivery" ? "🚴" : "🍽️";
    const tipoPedidoTexto =
      conversa.pedido.tipoPedido === "delivery" ? "Delivery" : "Restaurante";
    const tempoEstimado = result.estimated_time || 20;
    const tempoMin = tempoEstimado;
    const tempoMax = tempoEstimado + 10;

    const resumo = `✅ *PEDIDO CONFIRMADO!*

━━━━━━━━━━━━━━━━━━━━
🆔 *PEDIDO ${orderIdDisplay}*${sequenceInfo}${customerOrdersInfo}
━━━━━━━━━━━━━━━━━━━━

📋 *Resumo:*
${conversa.pedido.itens
  .map(
    (i) =>
      `${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity)
        .toFixed(2)
        .replace(".", ",")}`
  )
  .join("\n")}

💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*
${tipoPedidoEmoji} ${tipoPedidoTexto} | 💳 ${conversa.pedido.metodoPagamento}

⏰ *Tempo estimado: ${tempoMin}-${tempoMax} minutos*

Seu pedido está sendo preparado!

*Obrigado pela preferência!* 😊`;

    return { success: true, reply: resumo };
  }

  return {
    success: false,
    error: result.error || "Erro ao processar pedido",
    reply: `❌ Erro: ${result.error || "Tente novamente."}`,
  };
}

function processarMensagemNatural(text, items, precos, estoque) {
  const textoLower = (text || "").toLowerCase();
  const itens = [];
  let tipoPedido = "restaurante";
  let endereco = "";

  if (
    textoLower.includes("delivery") ||
    textoLower.includes("entrega") ||
    textoLower.includes("entregar")
  ) {
    tipoPedido = "delivery";
    const m = text.match(/(?:delivery|entrega|entregar)[\s:]*([^,]+(?:,.*)?)/i);
    if (m && m[1]) endereco = m[1].trim();
  }

  const padroes = [
    {
      regex:
        /(\d+)\s*(?:x\s*)?(?:hamburguer|hambúrguer|hamburguers)\s*(?:de\s*)?(bovino|boi|carne|suino|suíno|porco)/gi,
      map: {
        bovino: "hamburguer_bovino_simples",
        boi: "hamburguer_bovino_simples",
        carne: "hamburguer_bovino_simples",
        suino: "hamburguer_suino_simples",
        suíno: "hamburguer_suino_simples",
        porco: "hamburguer_suino_simples",
      },
    },
    { regex: /(\d+)\s*(?:x\s*)?(?:coca|cola)/gi, id: "refrigerante_coca" },
    { regex: /(\d+)\s*(?:x\s*)?(?:pepsi)/gi, id: "refrigerante_pepsi" },
    {
      regex: /(\d+)\s*(?:x\s*)?(?:guarana|guaraná)/gi,
      id: "refrigerante_guarana",
    },
    { regex: /(\d+)\s*(?:x\s*)?(?:fanta)/gi, id: "refrigerante_fanta" },
    {
      regex: /(\d+)\s*(?:x\s*)?(?:suco\s*(?:de\s*)?)?(?:laranja)/gi,
      id: "suco_laranja",
    },
    {
      regex: /(\d+)\s*(?:x\s*)?(?:suco\s*(?:de\s*)?)?(?:maracuja|maracujá)/gi,
      id: "suco_maracuja",
    },
    { regex: /(\d+)\s*(?:x\s*)?(?:agua|água)/gi, id: "agua" },
  ];

  for (const p of padroes) {
    const matches = [...text.matchAll(p.regex)];
    for (const m of matches) {
      const qtd = parseInt(m[1]) || 1;
      let itemId = p.id;
      if (p.map && m[2] && p.map[m[2].toLowerCase()])
        itemId = p.map[m[2].toLowerCase()];
      if (
        itemId &&
        itemDisponivel(itemId, estoque) &&
        precos[itemId] !== undefined
      ) {
        const nome = getNomeItem(itemId, items);
        itens.push({
          id: itemId,
          nome,
          quantidade: qtd,
          preco: precos[itemId],
        });
      }
    }
  }

  (items || []).forEach((item) => {
    const nomeLower = (item.name || "").toLowerCase().replace(/\s+/g, "\\s*");
    const regex = new RegExp(`(\\d+)\\s*(?:x\\s*)?(?:${nomeLower})`, "gi");
    const matches = [...text.matchAll(regex)];
    if (
      matches.length > 0 &&
      itemDisponivel(item.id, estoque) &&
      !itens.find((i) => i.id === item.id)
    ) {
      itens.push({
        id: item.id,
        nome: item.name,
        quantidade: parseInt(matches[0][1]) || 1,
        preco: precos[item.id] || 0,
      });
    }
  });

  return { itens, tipoPedido, endereco, sucesso: itens.length > 0 };
}

async function handleMessageRestaurante(from, text, config) {
  console.log("1. Entrei no handler");
  const hamburgueres = MENU_HARDCODED_EMERGENCIA.filter((i) =>
    (i.category || "").includes("hamburguer")
  );
  const nomeRestaurante = config?.nome_do_cliente || "Tamboril Burguer";
  const interactive = sendCardapioList(nomeRestaurante, hamburgueres);
  console.log("2. Preparei a mensagem interativa (list)");
  return interactive;
}

async function handleMessageRestaurante_FULL(from, text, config) {
  if (!config || !config.tenant_api_key || !config.desktop_api_url) {
    return { reply: "⚠️ Bot não configurado. Entre em contato com o suporte." };
  }

  const tenantSlug = config.tenant_slug || "tamboril-burguer";
  const nomeRestaurante = config.nome_do_cliente || "Pedidos Express";

  const categorias = [
    {
      id: "item1",
      name: "Item 1",
      price: 10,
      available: true,
      category: "hamburguer",
    },
    {
      id: "item2",
      name: "Item 2",
      price: 15,
      available: true,
      category: "hamburguer",
    },
  ];
  let items = categorias;
  const menuFalhou = items === null;
  if (!items || items.length === 0) {
    items = menuFalhou
      ? []
      : [
          {
            id: "hamburguer_bovino_simples",
            name: "Hambúrguer Bovino Simples",
            price: 18,
            available: true,
          },
          {
            id: "hamburguer_bovino_duplo",
            name: "Hambúrguer Bovino Duplo",
            price: 28,
            available: true,
          },
          {
            id: "hamburguer_suino_simples",
            name: "Hambúrguer Suíno Simples",
            price: 20,
            available: true,
          },
          {
            id: "hamburguer_suino_duplo",
            name: "Hambúrguer Suíno Duplo",
            price: 30,
            available: true,
          },
          {
            id: "refrigerante_coca",
            name: "Coca-Cola",
            price: 5,
            available: true,
          },
          {
            id: "refrigerante_pepsi",
            name: "Pepsi",
            price: 5,
            available: true,
          },
          {
            id: "refrigerante_guarana",
            name: "Guaraná",
            price: 5,
            available: true,
          },
          {
            id: "refrigerante_fanta",
            name: "Fanta",
            price: 5,
            available: true,
          },
          {
            id: "suco_laranja",
            name: "Suco de Laranja",
            price: 6,
            available: true,
          },
          {
            id: "suco_maracuja",
            name: "Suco de Maracujá",
            price: 6,
            available: true,
          },
          {
            id: "suco_limao",
            name: "Suco de Limão",
            price: 6,
            available: true,
          },
          {
            id: "suco_abacaxi",
            name: "Suco de Abacaxi",
            price: 6,
            available: true,
          },
          { id: "agua", name: "Água", price: 3, available: true },
        ];
  }
  const MSG_CARDAPIO_MANUTENCAO =
    "📋 *Cardápio em manutenção*\n\nEstamos atualizando nosso cardápio. Por favor, tente novamente em instantes ou digite *Atendente* para falar com nossa equipe. 👋";

  const { precos, estoque } = buildPrecosFromMenu(items);
  const conversa = await loadConversa(config.phone_number_id, from);
  console.log(
    "[Handler] loadConversa → estado:",
    conversa?.estado,
    "| text:",
    text?.slice(0, 30)
  );
  conversa.pedido = conversa.pedido || ESTADO_INICIO.pedido;
  conversa.pedido.itens = conversa.pedido.itens || [];
  conversa.pedido.telefone = String(from).replace(/\D/g, "");
  if (
    conversa.pedido.telefone.length === 11 &&
    !conversa.pedido.telefone.startsWith("55")
  ) {
    conversa.pedido.telefone = "55" + conversa.pedido.telefone;
  }

  const textoLower = (text || "").toLowerCase().trim();
  const textoLimpo = textoLower
    .replace(/[^\w\sàáâãäéèêëíìîïóòôõöúùûüç]/gi, "")
    .trim();

  try {
    // Normalizar só quando faz sentido: "1"/"2"/"3" = menu apenas no INICIO (no cardápio 1,2,3,4 = hambúrguer).
    const rawLower = (text || "").toLowerCase();
    let textNorm =
      rawLower.includes("cardápio") || rawLower.includes("cardapio")
        ? "cardapio"
        : rawLower.includes("resumo")
        ? "resumo"
        : rawLower.includes("atendente") || rawLower.includes("falar")
        ? "atendente"
        : textoLower;
    if (conversa.estado === ESTADO.INICIO) {
      if (textoLower === "1") textNorm = "cardapio";
      else if (textoLower === "2") textNorm = "resumo";
      else if (textoLower === "3") textNorm = "atendente";
    }

    if (textNorm === "sair" || textNorm === "encerrar") {
      await clearConversa(config.phone_number_id, from, conversa);
      return { reply: "👋 Obrigado! Até logo!" };
    }

    if (
      textNorm === "resumo" ||
      textoLower === "pedido" ||
      textoLower === "ver pedido"
    ) {
      return { reply: getResumoPedido(conversa) };
    }

    const estadosQuePermitemPedido = [ESTADO.INICIO, ESTADO.CARDAPIO];
    const storeStatus = await fetchStoreStatus(config);
    if (
      !storeStatus.isOpen &&
      estadosQuePermitemPedido.includes(conversa.estado)
    ) {
      return { reply: getMensagemLojaFechada(storeStatus) };
    }
    if (
      !storeStatus.isOpen &&
      conversa.estado !== ESTADO.METODO_PAGAMENTO &&
      conversa.pedido.itens.length === 0
    ) {
      return { reply: getMensagemLojaFechada(storeStatus) };
    }

    const hamburgueres = items.filter(
      (i) =>
        (i.category || "").includes("hamburguer") ||
        (i.id || "").includes("hamburguer")
    );
    const bebidas = items.filter(
      (i) =>
        (i.category || "").includes("bebida") ||
        (i.id || "").includes("refrigerante") ||
        (i.id || "").includes("suco") ||
        (i.id || "").includes("agua")
    );
    const acompanhamentos = items.filter((i) =>
      (i.category || "").includes("acompanhamento")
    );
    const sobremesas = items.filter((i) =>
      (i.category || "").includes("sobremesa")
    );
    const hamburgueresDisp = hamburgueres.filter((h) =>
      itemDisponivel(h.id, estoque)
    );
    const bebidasDisp = bebidas.filter((b) => itemDisponivel(b.id, estoque));
    const orderedAvailable = [
      ...hamburgueresDisp,
      ...bebidasDisp,
      ...acompanhamentos.filter((a) => itemDisponivel(a.id, estoque)),
      ...sobremesas.filter((s) => itemDisponivel(s.id, estoque)),
    ];

    // Fallback: estado INICIO mas usuário digitou número de item (4+)
    // → estado provavelmente se perdeu (persistência), tratar como CARDAPIO
    const escolhaFallback = parseInt(text.trim());
    if (
      conversa.estado === ESTADO.INICIO &&
      !isNaN(escolhaFallback) &&
      escolhaFallback >= 4 &&
      escolhaFallback <= hamburgueresDisp.length
    ) {
      conversa.estado = ESTADO.CARDAPIO;
    }

    switch (conversa.estado) {
      case ESTADO.INICIO: {
        if (
          textoLower === "oi" ||
          textoLower === "olá" ||
          textoLower === "ola" ||
          textoLower === "bom dia" ||
          textoLower === "boa tarde" ||
          textoLower === "boa noite" ||
          textoLower === "iniciar"
        ) {
          // TESTE: forçar resposta simples em vez de botões para validar envio via Meta API
          const saudacao = getSaudacaoBrasilia();
          console.log(
            "[Handler] texto='oi' → ENTROU no case ESTADO.INICIO, retornando TEXTO SIMPLES (teste)"
          );
          return {
            reply: `${nomeRestaurante}\n\n${saudacao}! 👋\n\nDigite *Cardápio* para ver o menu.`,
          };
        }
        if (textNorm === "cardapio" || textoLower === "1") {
          if (menuFalhou) return { reply: MSG_CARDAPIO_MANUTENCAO };
          conversa.estado = ESTADO.CARDAPIO;
          return sendCardapioHamburguerButtons(
            nomeRestaurante,
            hamburgueresDisp
          );
        }
        if (textNorm === "resumo") {
          return { reply: getResumoPedido(conversa) };
        }
        if (textNorm === "atendente") {
          marcarComoPrioridade(from, config.phone_number_id);
          return {
            reply:
              `👋 *ATENDIMENTO HUMANIZADO*\n\n` +
              `Um atendente vai te responder em breve.\n\n` +
              `Enquanto isso, você pode continuar montando seu pedido pelo cardápio! 😊`,
          };
        }

        const natural = processarMensagemNatural(text, items, precos, estoque);
        if (natural.sucesso && natural.itens.length > 0) {
          natural.itens.forEach((it) => {
            conversa.pedido.itens.push({
              id: it.id,
              name: it.nome,
              quantity: it.quantidade,
              price: it.preco,
            });
          });
          conversa.pedido.tipoPedido = natural.tipoPedido;
          if (natural.endereco) conversa.pedido.endereco = natural.endereco;

          let msg;
          if (natural.tipoPedido === "delivery" && !natural.endereco) {
            conversa.estado = ESTADO.ENDERECO_DELIVERY;
            msg = `✅ *Itens adicionados!*\n\n${gerarResumoPedido(
              conversa
            )}\n\n📦 *DELIVERY* - Informe seu endereço completo:`;
          } else {
            msg = `✅ *Itens adicionados!*\n\n${getResumoPedido(conversa)}\n\n`;
            if (!conversa.pedido.nome) {
              conversa.estado = ESTADO.NOME_CLIENTE;
              msg += "Qual seu nome?";
            } else {
              conversa.estado = ESTADO.METODO_PAGAMENTO;
              msg +=
                "*PAGAMENTO:*\n1️⃣ Dinheiro\n2️⃣ PIX\n3️⃣ Cartão\n4️⃣ Voltar\n\nDigite o número:";
            }
          }
          return { reply: msg };
        }

        const saudacao = getSaudacaoBrasilia();
        return {
          interactive: {
            type: "button",
            body: { text: `*${nomeRestaurante}*\n\n${saudacao}! 👋` },
            action: {
              buttons: [
                { type: "reply", reply: { id: "cardapio", title: "Cardápio" } },
                { type: "reply", reply: { id: "resumo", title: "Resumo" } },
                {
                  type: "reply",
                  reply: { id: "atendente", title: "Atendente" },
                },
              ],
            },
          },
        };
      }

      case ESTADO.CARDAPIO: {
        if (menuFalhou) return { reply: MSG_CARDAPIO_MANUTENCAO };
        if (querVoltar(text)) {
          conversa.estado = ESTADO.INICIO;
          const saudacao = getSaudacaoBrasilia();
          return {
            interactive: {
              type: "button",
              body: { text: `*${nomeRestaurante}*\n\n${saudacao}! 👋` },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: { id: "cardapio", title: "Cardápio" },
                  },
                  { type: "reply", reply: { id: "resumo", title: "Resumo" } },
                  {
                    type: "reply",
                    reply: { id: "atendente", title: "Atendente" },
                  },
                ],
              },
            },
          };
        }
        let item = null;
        const escolhaNum = parseInt(text.trim());
        if (
          !isNaN(escolhaNum) &&
          escolhaNum >= 1 &&
          escolhaNum <= hamburgueresDisp.length
        ) {
          item = hamburgueresDisp[escolhaNum - 1];
        } else {
          item = hamburgueres.find(
            (i) =>
              i.id === text.trim() ||
              i.id === textoLower ||
              (i.name && i.name.toLowerCase().includes(textoLower))
          );
        }
        if (!item) {
          return sendCardapioHamburguerButtons(
            nomeRestaurante,
            hamburgueresDisp
          );
        }
        if (!itemDisponivel(item.id, estoque)) {
          return {
            reply: `❌ Item indisponível. Escolha outro.\n\n⬅️ *VOLTAR*`,
          };
        }
        conversa.pedido.tipoSelecionado = item.id;
        conversa.estado = ESTADO.AGUARDANDO_QUANTIDADE;
        return {
          reply: `Ótima escolha! Quantas unidades de *${item.name}* você deseja? (Digite apenas o número)\n\n⬅️ *VOLTAR*`,
        };
      }

      case ESTADO.AGUARDANDO_QUANTIDADE: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.CARDAPIO;
          delete conversa.pedido.tipoSelecionado;
          let msg = `*${nomeRestaurante}*\n\nFaça seu pedido! Escolha seu *hambúrguer*:\n━━━━━━━━━━━━━━━━━━━━\n\n`;
          hamburgueresDisp.forEach((h, i) => {
            msg += `${i + 1}. ${h.name} — R$ ${Number(h.price)
              .toFixed(2)
              .replace(".", ",")}\n`;
          });
          msg += `\n⬅️ *VOLTAR*`;
          return { reply: msg };
        }
        const qtd = parseInt(text.trim());
        if (isNaN(qtd) || qtd < 1 || qtd > 10) {
          return {
            reply: "❌ Quantidade inválida. Digite 1 a 10.\n\n⬅️ *VOLTAR*",
          };
        }
        const tipo = conversa.pedido.tipoSelecionado;
        if (!tipo) {
          if (menuFalhou) return { reply: MSG_CARDAPIO_MANUTENCAO };
          conversa.estado = ESTADO.CARDAPIO;
          return sendCardapioHamburguerButtons(
            nomeRestaurante,
            hamburgueresDisp
          );
        }
        const nomeItem = getNomeItem(tipo, items);
        const preco = precos[tipo] || 0;
        const novoItem = {
          id: tipo,
          name: nomeItem,
          quantity: qtd,
          price: preco,
        };
        conversa.pedido.itens.push(novoItem);
        delete conversa.pedido.tipoSelecionado;
        conversa.estado = ESTADO.OFFER_UPSELL;
        return {
          interactive: {
            type: "button",
            body: {
              text: `Adicionado ${qtd}x ${nomeItem}! 🍟\n\nDeseja adicionar uma *Batata Frita* por mais R$ 10,00?`,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: { id: "upsell_sim", title: "Sim, por favor!" },
                },
                {
                  type: "reply",
                  reply: { id: "upsell_nao", title: "Não, obrigado." },
                },
              ],
            },
          },
        };
      }

      case ESTADO.OFFER_UPSELL: {
        const querSim =
          textoLower === "sim" ||
          textoLower === "s" ||
          textoLower === "upsell_sim" ||
          textoLower.includes("sim");
        const querNao =
          textoLower === "nao" ||
          textoLower === "não" ||
          textoLower === "n" ||
          textoLower === "upsell_nao" ||
          textoLower.includes("não") ||
          textoLower.includes("obrigado");
        if (querVoltar(text)) {
          conversa.estado = ESTADO.AGUARDANDO_QUANTIDADE;
          const ultimoItem =
            conversa.pedido.itens[conversa.pedido.itens.length - 1];
          if (ultimoItem) {
            conversa.pedido.tipoSelecionado = ultimoItem.id;
            conversa.pedido.itens.pop();
          }
          return {
            reply: "Digite a quantidade (1 a 10).\n\n⬅️ *VOLTAR*",
          };
        }
        if (!querSim && !querNao) {
          return {
            interactive: {
              type: "button",
              body: {
                text: "Deseja adicionar uma *Batata Frita* por mais R$ 10,00?",
              },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: { id: "upsell_sim", title: "Sim, por favor!" },
                  },
                  {
                    type: "reply",
                    reply: { id: "upsell_nao", title: "Não, obrigado." },
                  },
                ],
              },
            },
          };
        }
        if (querSim) {
          conversa.pedido.itens.push({
            id: BATATA_FRITA.id,
            name: BATATA_FRITA.name,
            quantity: 1,
            price: BATATA_FRITA.price,
          });
        }
        conversa.estado = ESTADO.ESCOLHER_BEBIDA;
        let msgBebida = `Agora escolha sua *bebida*:\n`;
        msgBebida += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        bebidasDisp.forEach((b, i) => {
          msgBebida += `${i + 1}. ${b.name} — R$ ${Number(b.price)
            .toFixed(2)
            .replace(".", ",")}\n`;
        });
        msgBebida += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        msgBebida += `Digite o *número* ou *nome* da bebida.\n\n`;
        msgBebida += `0 — Pular (sem bebida)\n⬅️ *VOLTAR*`;
        return { reply: msgBebida };
      }

      case ESTADO.ESCOLHER_BEBIDA: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.OFFER_UPSELL;
          conversa.pedido.itens = conversa.pedido.itens.filter(
            (i) => i.id !== BATATA_FRITA.id
          );
          return {
            reply:
              "Adicionado! 🍟 Aceita uma porção de *batata frita* por mais R$ 10,00? (Responda *Sim* ou *Não*)\n\n⬅️ *VOLTAR*",
          };
        }
        if (
          textoLower === "0" ||
          textoLower === "pular" ||
          textoLower === "nao" ||
          textoLower === "não"
        ) {
          conversa.estado = ESTADO.TIPO_PEDIDO;
          return {
            reply: `*TIPO DE PEDIDO:*\n\n1️⃣ 🍽️ Restaurante\n2️⃣ 🚴 Delivery\n\nDigite o número:`,
          };
        }
        let itemBebida = null;
        const numBebida = parseInt(text.trim());
        if (
          !isNaN(numBebida) &&
          numBebida >= 1 &&
          numBebida <= bebidasDisp.length
        ) {
          itemBebida = bebidasDisp[numBebida - 1];
        } else {
          itemBebida = bebidas.find(
            (i) =>
              i.id === text.trim() ||
              i.id === textoLower ||
              (i.name && i.name.toLowerCase().includes(textoLower))
          );
        }
        if (!itemBebida) {
          return {
            reply:
              "❌ Opção inválida. Digite o número da bebida ou 0 para pular.\n\n⬅️ *VOLTAR*",
          };
        }
        if (!itemDisponivel(itemBebida.id, estoque)) {
          return {
            reply: `❌ Item indisponível. Escolha outro.\n\n⬅️ *VOLTAR*`,
          };
        }
        conversa.pedido.tipoSelecionado = itemBebida.id;
        conversa.estado = ESTADO.QUANTIDADE_BEBIDA;
        return {
          reply: `✅ ${itemBebida.name} — R$ ${Number(itemBebida.price)
            .toFixed(2)
            .replace(".", ",")}\n\n*Quantidade?* (1 a 10)\n\n⬅️ *VOLTAR*`,
        };
      }

      case ESTADO.QUANTIDADE_BEBIDA: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.ESCOLHER_BEBIDA;
          delete conversa.pedido.tipoSelecionado;
          let m = `Agora escolha sua *bebida*:\n━━━━━━━━━━━━━━━━━━━━\n\n`;
          bebidasDisp.forEach((b, i) => {
            m += `${i + 1}. ${b.name} — R$ ${Number(b.price)
              .toFixed(2)
              .replace(".", ",")}\n`;
          });
          m += `\n0 — Pular\n⬅️ *VOLTAR*`;
          return { reply: m };
        }
        const qtdBebida = parseInt(text.trim());
        if (isNaN(qtdBebida) || qtdBebida < 1 || qtdBebida > 10) {
          return {
            reply: "❌ Quantidade inválida. Digite 1 a 10.\n\n⬅️ *VOLTAR*",
          };
        }
        const tipoBebida = conversa.pedido.tipoSelecionado;
        const nomeBebida = getNomeItem(tipoBebida, items);
        const precoBebida = precos[tipoBebida] || 0;
        conversa.pedido.itens.push({
          id: tipoBebida,
          name: nomeBebida,
          quantity: qtdBebida,
          price: precoBebida,
        });
        delete conversa.pedido.tipoSelecionado;
        conversa.estado = ESTADO.TIPO_PEDIDO;
        return {
          reply: `✅ ${qtdBebida}x ${nomeBebida} adicionado!\n\n*TIPO DE PEDIDO:*\n\n1️⃣ 🍽️ Restaurante\n2️⃣ 🚴 Delivery\n\nDigite o número:`,
        };
      }

      case ESTADO.TIPO_PEDIDO: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.ESCOLHER_BEBIDA;
          const isBebida = (id) =>
            id &&
            (String(id).includes("refrigerante") ||
              String(id).includes("suco") ||
              String(id) === "agua");
          const last = conversa.pedido.itens[conversa.pedido.itens.length - 1];
          if (last && isBebida(last.id)) conversa.pedido.itens.pop();
          let msgVolta = `Agora escolha sua *bebida*:\n━━━━━━━━━━━━━━━━━━━━\n\n`;
          bebidasDisp.forEach((b, i) => {
            msgVolta += `${i + 1}. ${b.name} — R$ ${Number(b.price)
              .toFixed(2)
              .replace(".", ",")}\n`;
          });
          msgVolta += `\n0 — Pular (sem bebida)\n⬅️ *VOLTAR*`;
          return { reply: msgVolta };
        }
        if (textoLower === "1" || textoLower.includes("restaurante")) {
          conversa.pedido.tipoPedido = "restaurante";
          conversa.estado = ESTADO.NOME_CLIENTE;
          return { reply: "✅ Restaurante!\n\nQual seu nome?\n\n⬅️ *VOLTAR*" };
        }
        if (textoLower === "2" || textoLower.includes("delivery")) {
          conversa.pedido.tipoPedido = "delivery";
          conversa.estado = ESTADO.ENDERECO_DELIVERY;
          const resumo = gerarResumoPedido(conversa);
          return {
            reply: `${resumo}\n\n✅ Delivery!\n\nInforme seu *endereço completo* (rua, número, bairro):\n\n⬅️ *VOLTAR*`,
          };
        }
        return {
          reply: "Digite 1 (restaurante) ou 2 (delivery).\n\n⬅️ *VOLTAR*",
        };
      }

      case ESTADO.ENDERECO_DELIVERY: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.TIPO_PEDIDO;
          return { reply: "1️⃣ Restaurante\n2️⃣ Delivery\n\nDigite o número:" };
        }
        if (text.trim().length > 10) {
          conversa.pedido.endereco = text.trim();
          conversa.estado = ESTADO.NOME_CLIENTE;
          return {
            reply: `✅ Endereço: ${conversa.pedido.endereco}\n\nQual seu nome?\n\n⬅️ *VOLTAR*`,
          };
        }
        const resumoEndereco = gerarResumoPedido(conversa);
        return {
          reply: `${resumoEndereco}\n\n❌ Informe um endereço completo.\n\n⬅️ *VOLTAR*`,
        };
      }

      case ESTADO.NOME_CLIENTE: {
        if (querVoltar(text)) {
          if (conversa.pedido.tipoPedido === "delivery") {
            conversa.estado = ESTADO.ENDERECO_DELIVERY;
            const resumo = gerarResumoPedido(conversa);
            return {
              reply: `${resumo}\n\nInforme seu *endereço completo* (rua, número, bairro):\n\n⬅️ *VOLTAR*`,
            };
          }
          conversa.estado = ESTADO.TIPO_PEDIDO;
          return { reply: "1️⃣ Restaurante\n2️⃣ Delivery\n\nDigite o número:" };
        }
        if (text.trim().length > 0) {
          conversa.pedido.nome = text.trim();
          conversa.estado = ESTADO.METODO_PAGAMENTO;
          return {
            reply: `✅ Nome: ${conversa.pedido.nome}\n\n*PAGAMENTO:*\n1️⃣ Dinheiro\n2️⃣ PIX\n3️⃣ Cartão\n4️⃣ Voltar\n\nDigite o número:`,
          };
        }
        return { reply: "Por favor, digite seu nome.\n\n⬅️ *VOLTAR*" };
      }

      case ESTADO.METODO_PAGAMENTO: {
        const metodo = processarMetodoPagamento(text);
        if (metodo === "VOLTAR") {
          conversa.estado = ESTADO.NOME_CLIENTE;
          return { reply: "Qual seu nome?\n\n⬅️ *VOLTAR*" };
        }
        if (metodo) {
          conversa.pedido.metodoPagamento = metodo;
          const result = await finalizarPedidoWebhook(conversa, {
            ...config,
            tenant_slug: tenantSlug,
          });
          await clearConversa(config.phone_number_id, from, conversa);
          return { reply: result.reply };
        }
        return {
          reply: "Digite 1 (Dinheiro), 2 (PIX) ou 3 (Cartão).\n\n4️⃣ Voltar",
        };
      }

      default:
        conversa.estado = ESTADO.INICIO;
        return {
          interactive: {
            type: "button",
            body: {
              text: `*${nomeRestaurante}*\n\n${getSaudacaoBrasilia()}! 👋`,
            },
            action: {
              buttons: [
                { type: "reply", reply: { id: "cardapio", title: "Cardápio" } },
                { type: "reply", reply: { id: "resumo", title: "Resumo" } },
                {
                  type: "reply",
                  reply: { id: "atendente", title: "Atendente" },
                },
              ],
            },
          },
        };
    }
  } finally {
    await saveConversa(config.phone_number_id, from, conversa);
  }
}

function isRestauranteConfig(config) {
  return !!(
    config &&
    (config.tenant_slug || config.tenant_api_key) &&
    config.desktop_api_url
  );
}

module.exports = {
  handleMessageRestaurante,
  isRestauranteConfig,
  getConversasPrioridade: () =>
    require("./prioridade-conversas").listarConversasPrioritarias,
};
