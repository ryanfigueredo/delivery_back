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
  TIPO_HAMBURGUER: "tipo_hamburguer",
  QUANTIDADE_HAMBURGUER: "quantidade_hamburguer",
  ADICIONAR_MAIS: "adicionar_mais",
  TIPO_REFRIGERANTE: "tipo_refrigerante",
  QUANTIDADE_REFRIGERANTE: "quantidade_refrigerante",
  TIPO_SUCO: "tipo_suco",
  QUANTIDADE_SUCO: "quantidade_suco",
  QUANTIDADE_BEBIDA: "quantidade_bebida",
  TIPO_PEDIDO: "tipo_pedido",
  ENDERECO_DELIVERY: "endereco_delivery",
  NOME_CLIENTE: "nome_cliente",
  METODO_PAGAMENTO: "metodo_pagamento",
  FINALIZAR: "finalizar",
};

async function clearConversa(phoneNumberId, from, conversa) {
  if (conversa) {
    conversa.estado = ESTADO.INICIO;
    conversa.pedido = { ...ESTADO_INICIO.pedido };
  }
  return saveConversa(phoneNumberId, from, conversa || ESTADO_INICIO);
}

async function fetchMenu(config) {
  const url = `${config.desktop_api_url}/api/bot/menu/public`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: { "X-API-Key": config.tenant_api_key },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    console.error("[Restaurante] Erro ao buscar menu:", e.message);
    return null;
  }
}

async function fetchStoreStatus(config) {
  const url = `${config.desktop_api_url}/api/store/status`;
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

function getMensagemLojaFechada(status) {
  let msg = `🚫 *LOJA FECHADA*\n\n`;
  if (status.message) msg += `${status.message}\n\n`;
  if (status.nextOpenTime)
    msg += `⏰ *Horário de abertura:* ${status.nextOpenTime}\n\n`;
  else msg += `⏰ Não há previsão de abertura no momento.\n\n`;
  msg += `Obrigado por escolher Pedidos Express!\nVolte em breve! 👋`;
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

  const url = `${config.desktop_api_url}/api/webhook/whatsapp`;
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
  if (!config || !config.tenant_api_key || !config.desktop_api_url) {
    return { reply: "⚠️ Bot não configurado. Entre em contato com o suporte." };
  }

  const tenantSlug = config.tenant_slug || "tamboril-burguer";
  const nomeRestaurante = config.nome_do_cliente || "Pedidos Express";

  let items = await fetchMenu(config);
  if (!items || items.length === 0) {
    items = [
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
      { id: "refrigerante_coca", name: "Coca-Cola", price: 5, available: true },
      { id: "refrigerante_pepsi", name: "Pepsi", price: 5, available: true },
      {
        id: "refrigerante_guarana",
        name: "Guaraná",
        price: 5,
        available: true,
      },
      { id: "refrigerante_fanta", name: "Fanta", price: 5, available: true },
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
      { id: "suco_limao", name: "Suco de Limão", price: 6, available: true },
      {
        id: "suco_abacaxi",
        name: "Suco de Abacaxi",
        price: 6,
        available: true,
      },
      { id: "agua", name: "Água", price: 3, available: true },
    ];
  }

  const { precos, estoque } = buildPrecosFromMenu(items);
  const conversa = await loadConversa(config.phone_number_id, from);
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
    // Normalizar: botões enviam id (cardapio, resumo, atendente); lista pode enviar "📋 Cardápio".
    // Prioridade: título/texto que contenha "cardápio" ou "resumo" para nunca trocar um pelo outro.
    const rawLower = (text || "").toLowerCase();
    let textNorm =
      rawLower.includes("cardápio") || rawLower.includes("cardapio")
        ? "cardapio"
        : rawLower.includes("resumo")
        ? "resumo"
        : textoLower === "1" ||
          textoLower === "cardapio" ||
          textoLower === "cardápio" ||
          textoLimpo === "cardapio" ||
          textoLimpo === "cardápio"
        ? "cardapio"
        : textoLower === "2" ||
          textoLower === "resumo" ||
          textoLimpo === "resumo"
        ? "resumo"
        : textoLower === "3" ||
          textoLower.includes("atendente") ||
          textoLower.includes("falar") ||
          textoLimpo.includes("atendente")
        ? "atendente"
        : textoLower;

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
    const orderedAvailable = [
      ...hamburgueres.filter((h) => itemDisponivel(h.id, estoque)),
      ...bebidas.filter((b) => itemDisponivel(b.id, estoque)),
      ...acompanhamentos.filter((a) => itemDisponivel(a.id, estoque)),
      ...sobremesas.filter((s) => itemDisponivel(s.id, estoque)),
    ];

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
          const hora = new Date().getHours();
          const saudacao =
            hora >= 18 ? "Boa noite" : hora >= 12 ? "Boa tarde" : "Bom dia";
          return {
            interactive: {
              type: "button",
              body: {
                text: `*${nomeRestaurante}*\n\n${saudacao}! 👋\n\nEscolha uma opção abaixo:\n\n📋 Cardápio — ver o menu\n🛒 Resumo — ver seu pedido\n👤 Atendente — falar conosco`,
              },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: { id: "cardapio", title: "📋 Cardápio" },
                  },
                  {
                    type: "reply",
                    reply: { id: "resumo", title: "🛒 Resumo" },
                  },
                  {
                    type: "reply",
                    reply: { id: "atendente", title: "👤 Atendente" },
                  },
                ],
              },
            },
          };
        }
        if (textNorm === "cardapio" || textoLower === "1") {
          conversa.estado = ESTADO.CARDAPIO;
          const hambDisp = hamburgueres.filter((h) =>
            itemDisponivel(h.id, estoque)
          );
          const bebDisp = bebidas.filter((b) => itemDisponivel(b.id, estoque));
          const accompDisp = acompanhamentos.filter((a) =>
            itemDisponivel(a.id, estoque)
          );
          const sobremDisp = sobremesas.filter((s) =>
            itemDisponivel(s.id, estoque)
          );
          const totalDisp =
            hambDisp.length +
            bebDisp.length +
            accompDisp.length +
            sobremDisp.length;
          // Lista interativa: até 10 itens por seção (limite WhatsApp)
          if (totalDisp > 0 && totalDisp <= 40) {
            const sections = [];
            if (hambDisp.length > 0) {
              sections.push({
                title: "🍔 Hambúrgueres",
                rows: hambDisp.slice(0, 10).map((h) => ({
                  id: h.id,
                  title: h.name.substring(0, 24),
                  description: `R$ ${Number(h.price)
                    .toFixed(2)
                    .replace(".", ",")}`,
                })),
              });
            }
            if (bebDisp.length > 0) {
              sections.push({
                title: "🥤 Bebidas",
                rows: bebDisp.slice(0, 10).map((b) => ({
                  id: b.id,
                  title: b.name.substring(0, 24),
                  description: `R$ ${Number(b.price)
                    .toFixed(2)
                    .replace(".", ",")}`,
                })),
              });
            }
            if (accompDisp.length > 0) {
              sections.push({
                title: "🍟 Acompanhamentos",
                rows: accompDisp.slice(0, 10).map((a) => ({
                  id: a.id,
                  title: a.name.substring(0, 24),
                  description: `R$ ${Number(a.price)
                    .toFixed(2)
                    .replace(".", ",")}`,
                })),
              });
            }
            if (sobremDisp.length > 0) {
              sections.push({
                title: "🍰 Sobremesas",
                rows: sobremDisp.slice(0, 10).map((s) => ({
                  id: s.id,
                  title: s.name.substring(0, 24),
                  description: `R$ ${Number(s.price)
                    .toFixed(2)
                    .replace(".", ",")}`,
                })),
              });
            }
            if (sections.length > 0) {
              return {
                interactive: {
                  type: "list",
                  header: { type: "text", text: `${nomeRestaurante}` },
                  body: {
                    text: "📋 Escolha um item do cardápio ou digite seu pedido:",
                  },
                  footer: { text: "⬅️ Digite VOLTAR para voltar" },
                  action: {
                    button: "Ver Cardápio",
                    sections,
                  },
                },
              };
            }
          }
          let menuTexto = `*${nomeRestaurante}*\n\n`;
          menuTexto += `📋 *CARDÁPIO*\n`;
          menuTexto += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          let num = 1;
          if (hamburgueres.some((h) => itemDisponivel(h.id, estoque))) {
            menuTexto += `🍔 *Hambúrgueres*\n`;
            hamburgueres.forEach((h) => {
              if (itemDisponivel(h.id, estoque)) {
                menuTexto += `${num}. ${h.name} — R$ ${Number(h.price)
                  .toFixed(2)
                  .replace(".", ",")}\n`;
                num++;
              }
            });
            menuTexto += "\n";
          }
          if (bebidas.some((b) => itemDisponivel(b.id, estoque))) {
            menuTexto += `🥤 *Bebidas*\n`;
            bebidas.forEach((b) => {
              if (itemDisponivel(b.id, estoque)) {
                menuTexto += `${num}. ${b.name} — R$ ${Number(b.price)
                  .toFixed(2)
                  .replace(".", ",")}\n`;
                num++;
              }
            });
            menuTexto += "\n";
          }
          if (acompanhamentos.some((a) => itemDisponivel(a.id, estoque))) {
            menuTexto += `🍟 *Acompanhamentos*\n`;
            acompanhamentos.forEach((a) => {
              if (itemDisponivel(a.id, estoque)) {
                menuTexto += `${num}. ${a.name} — R$ ${Number(a.price)
                  .toFixed(2)
                  .replace(".", ",")}\n`;
                num++;
              }
            });
            menuTexto += "\n";
          }
          if (sobremesas.some((s) => itemDisponivel(s.id, estoque))) {
            menuTexto += `🍰 *Sobremesas*\n`;
            sobremesas.forEach((s) => {
              if (itemDisponivel(s.id, estoque)) {
                menuTexto += `${num}. ${s.name} — R$ ${Number(s.price)
                  .toFixed(2)
                  .replace(".", ",")}\n`;
                num++;
              }
            });
            menuTexto += "\n";
          }
          menuTexto += `━━━━━━━━━━━━━━━━━━━━\n`;
          menuTexto += `Digite o *número* ou *nome* do item para adicionar.\n\n`;
          menuTexto += `⬅️ *VOLTAR* — voltar ao menu`;
          return { reply: menuTexto };
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

          let msg = `✅ *Itens adicionados!*\n\n${getResumoPedido(
            conversa
          )}\n\n`;
          if (natural.tipoPedido === "delivery" && !natural.endereco) {
            conversa.estado = ESTADO.ENDERECO_DELIVERY;
            msg += "📦 *DELIVERY* - Informe seu endereço completo:";
          } else if (!conversa.pedido.nome) {
            conversa.estado = ESTADO.NOME_CLIENTE;
            msg += "Qual seu nome?";
          } else {
            conversa.estado = ESTADO.ADICIONAR_MAIS;
            msg += "Deseja adicionar mais itens?\n\n1️⃣ Sim\n2️⃣ Não, finalizar";
          }
          return { reply: msg };
        }

        const hora = new Date().getHours();
        const saudacao =
          hora >= 18 ? "Boa noite" : hora >= 12 ? "Boa tarde" : "Bom dia";
        return {
          reply: `*${nomeRestaurante}*\n\n${saudacao}! 👋\n\n*Escolha:*\n1️⃣ Ver cardápio\n2️⃣ Ver resumo do pedido\n3️⃣ Falar com atendente\n\nOu digite seu pedido!`,
        };
      }

      case ESTADO.CARDAPIO: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.INICIO;
          const hora = new Date().getHours();
          const saudacao =
            hora >= 18 ? "Boa noite" : hora >= 12 ? "Boa tarde" : "Bom dia";
          return {
            interactive: {
              type: "button",
              body: {
                text: `*${nomeRestaurante}*\n\n${saudacao}! 👋\n\nEscolha uma opção:`,
              },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: { id: "cardapio", title: "📋 Cardápio" },
                  },
                  {
                    type: "reply",
                    reply: { id: "resumo", title: "🛒 Resumo" },
                  },
                  {
                    type: "reply",
                    reply: { id: "atendente", title: "👤 Atendente" },
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
          escolhaNum <= orderedAvailable.length
        ) {
          item = orderedAvailable[escolhaNum - 1];
        } else {
          item = items.find((i) => i.id === text.trim() || i.id === textoLower);
        }
        if (!item) {
          return {
            reply:
              "❌ Opção inválida. Digite o número ou escolha da lista.\n\n⬅️ *VOLTAR* para voltar",
          };
        }
        if (!itemDisponivel(item.id, estoque)) {
          return {
            reply: `❌ Item indisponível. Escolha outro.\n\n⬅️ *VOLTAR*`,
          };
        }
        conversa.pedido.tipoSelecionado = item.id;
        conversa.estado = ESTADO.QUANTIDADE_HAMBURGUER;
        return {
          reply: `✅ ${item.name} - R$ ${Number(item.price)
            .toFixed(2)
            .replace(".", ",")}\n\nQuantidade? (1 a 10)\n\n⬅️ *VOLTAR*`,
        };
      }

      case ESTADO.QUANTIDADE_HAMBURGUER: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.CARDAPIO;
          delete conversa.pedido.tipoSelecionado;
          return { reply: "Digite o número do item desejado.\n\n⬅️ *VOLTAR*" };
        }
        const qtd = parseInt(text.trim());
        if (isNaN(qtd) || qtd < 1 || qtd > 10) {
          return {
            reply: "❌ Quantidade inválida. Digite 1 a 10.\n\n⬅️ *VOLTAR*",
          };
        }
        const tipo = conversa.pedido.tipoSelecionado;
        const nomeItem = getNomeItem(tipo, items);
        const preco = precos[tipo] || 0;
        conversa.pedido.itens.push({
          id: tipo,
          name: nomeItem,
          quantity: qtd,
          price: preco,
        });
        delete conversa.pedido.tipoSelecionado;
        conversa.estado = ESTADO.ADICIONAR_MAIS;
        return {
          reply: `✅ ${qtd}x ${nomeItem} adicionado!\n\nDeseja adicionar mais?\n\n1️⃣ Sim\n2️⃣ Não, finalizar\n\n⬅️ *VOLTAR*`,
        };
      }

      case ESTADO.ADICIONAR_MAIS: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.CARDAPIO;
          return { reply: "Digite o número do item.\n\n⬅️ *VOLTAR*" };
        }
        if (textoLower === "1" || textoLower.includes("sim")) {
          conversa.estado = ESTADO.CARDAPIO;
          let m = `*CARDÁPIO*\n\n`;
          orderedAvailable.forEach((it, i) => {
            m += `${i + 1}. ${it.name} - R$ ${Number(it.price)
              .toFixed(2)
              .replace(".", ",")}\n`;
          });
          m += `\nDigite o número.\n\n⬅️ *VOLTAR*`;
          return { reply: m };
        }
        if (
          textoLower === "2" ||
          textoLower.includes("nao") ||
          textoLower.includes("não")
        ) {
          conversa.estado = ESTADO.TIPO_PEDIDO;
          return {
            reply: `*TIPO DE PEDIDO:*\n\n1️⃣ 🍽️ Restaurante\n2️⃣ 🚴 Delivery\n\nDigite o número:`,
          };
        }
        return {
          reply:
            "Digite *1* para adicionar mais ou *2* para finalizar.\n\n⬅️ *VOLTAR*",
        };
      }

      case ESTADO.TIPO_PEDIDO: {
        if (querVoltar(text)) {
          conversa.estado = ESTADO.ADICIONAR_MAIS;
          return {
            reply: `${getResumoPedido(
              conversa
            )}\n\n1️⃣ Sim - adicionar mais\n2️⃣ Não - finalizar`,
          };
        }
        if (textoLower === "1" || textoLower.includes("restaurante")) {
          conversa.pedido.tipoPedido = "restaurante";
          conversa.estado = ESTADO.NOME_CLIENTE;
          return { reply: "✅ Restaurante!\n\nQual seu nome?\n\n⬅️ *VOLTAR*" };
        }
        if (textoLower === "2" || textoLower.includes("delivery")) {
          conversa.pedido.tipoPedido = "delivery";
          conversa.estado = ESTADO.ENDERECO_DELIVERY;
          return {
            reply:
              "✅ Delivery!\n\nInforme seu *endereço completo* (rua, número, bairro):\n\n⬅️ *VOLTAR*",
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
        return { reply: "❌ Informe um endereço completo.\n\n⬅️ *VOLTAR*" };
      }

      case ESTADO.NOME_CLIENTE: {
        if (querVoltar(text)) {
          if (conversa.pedido.tipoPedido === "delivery") {
            conversa.estado = ESTADO.ENDERECO_DELIVERY;
            return { reply: "Informe seu endereço completo:\n\n⬅️ *VOLTAR*" };
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
          reply: `*${nomeRestaurante}*\n\nOlá! 👋\n\n1️⃣ Ver cardápio\n2️⃣ Ver resumo\n3️⃣ Falar com atendente`,
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
