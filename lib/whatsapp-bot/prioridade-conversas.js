/**
 * Sistema de prioridade de conversas (Bot de Atendimento)
 */

const conversasPrioridade = new Map();

function marcarComoPrioridade(remetente, phoneNumberId) {
  const key = phoneNumberId ? `${phoneNumberId}:${remetente}` : remetente;
  conversasPrioridade.set(key, {
    remetente,
    phoneNumberId: phoneNumberId || null,
    timestamp: Date.now(),
    ultimaMensagem: Date.now(),
  });
  console.log(`[PRIORIDADE] ${remetente} pediu atendimento`);
}

function ehPrioridade(remetente, phoneNumberId) {
  if (phoneNumberId) {
    return conversasPrioridade.has(`${phoneNumberId}:${remetente}`);
  }
  return (
    conversasPrioridade.has(remetente) ||
    Array.from(conversasPrioridade.values()).some(
      (v) => v.remetente === remetente,
    )
  );
}

function listarConversasPrioritarias(phoneNumberId) {
  return Array.from(conversasPrioridade.entries())
    .filter(([key, info]) => {
      if (!phoneNumberId) return true;
      if (key.startsWith && key.startsWith(`${phoneNumberId}:`)) return true;
      if (info.phoneNumberId === phoneNumberId) return true;
      return false;
    })
    .map(([, info]) => ({
      remetente: info.remetente || info,
      tempoEsperaMin: Math.floor(
        (Date.now() - (info.timestamp || 0)) / 1000 / 60,
      ),
    }));
}

module.exports = {
  marcarComoPrioridade,
  ehPrioridade,
  listarConversasPrioritarias,
  _map: conversasPrioridade,
};
