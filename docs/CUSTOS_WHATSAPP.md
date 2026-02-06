# Custos das Mensagens WhatsApp Business API

## Visão Geral

O WhatsApp Business API categoriza as mensagens em 4 tipos principais, cada um com custos diferentes. É **essencial** entender essas categorias para otimizar os custos operacionais do PedidosExpress.

## Categorias e Custos

| Categoria | Descrição | Custo USD | Custo BRL (Aprox.) |
|-----------|-----------|-----------|-------------------|
| **Marketing** | Promoções, ofertas, novidades | **$ 0,0782** | ~ R$ 0,39 - 0,45 |
| **Utilidade** | Avisos de pedidos, notas fiscais, alertas | **$ 0,0085** | ~ R$ 0,04 - 0,06 |
| **Autenticação** | Códigos OTP (2FA), senhas | **$ 0,0085** | ~ R$ 0,04 - 0,06 |
| **Serviço** | Respostas a dúvidas do cliente | **Grátis** | R$ 0,00 |

## Regras Importantes

### Janela de 24 Horas (Conversation Window)

- **Mensagens de Serviço são GRATUITAS** apenas dentro de **24 horas** após o cliente enviar uma mensagem.
- Após 24 horas, qualquer mensagem enviada será cobrada como **Marketing**, **Utilidade** ou **Autenticação**.
- Mensagens iniciadas pela empresa (fora da janela de 24h) devem usar **templates aprovados** pela Meta.

### Templates de Mensagem

- Mensagens enviadas **fora da janela de 24h** precisam usar **templates pré-aprovados** pela Meta.
- Templates podem ser categorizados como:
  - **Marketing**: Promoções, ofertas
  - **Utilidade**: Confirmações de pedidos, avisos de entrega, notas fiscais
  - **Autenticação**: Códigos de verificação, senhas temporárias

## Impacto nos Planos PedidosExpress

### Plano Básico (1.000 mensagens/mês)

**Cenário Otimista (100% Serviço):**
- Custo: **R$ 0,00** (todas dentro da janela de 24h)
- Margem: 100% do valor do plano

**Cenário Realista (70% Serviço, 30% Utilidade):**
- 700 mensagens Serviço: R$ 0,00
- 300 mensagens Utilidade: 300 × R$ 0,05 = **R$ 15,00**
- Custo total: **R$ 15,00**
- Margem: R$ 297 - R$ 15 = **R$ 282,00** (95% de margem)

**Cenário Pessimista (50% Serviço, 50% Utilidade):**
- 500 mensagens Serviço: R$ 0,00
- 500 mensagens Utilidade: 500 × R$ 0,05 = **R$ 25,00**
- Custo total: **R$ 25,00**
- Margem: R$ 297 - R$ 25 = **R$ 272,00** (92% de margem)

### Plano Completo (2.500 mensagens/mês)

**Cenário Realista (70% Serviço, 30% Utilidade):**
- 1.750 mensagens Serviço: R$ 0,00
- 750 mensagens Utilidade: 750 × R$ 0,05 = **R$ 37,50**
- Custo total: **R$ 37,50**
- Margem: R$ 497 - R$ 37,50 = **R$ 459,50** (92% de margem)

### Plano Premium (Ilimitado)

**Considerações:**
- Clientes Premium podem enviar volumes muito maiores
- Custos variam conforme o mix de categorias
- **Recomendação**: Monitorar custos por cliente e ajustar preço se necessário

**Exemplo (10.000 mensagens/mês, 60% Serviço, 40% Utilidade):**
- 6.000 mensagens Serviço: R$ 0,00
- 4.000 mensagens Utilidade: 4.000 × R$ 0,05 = **R$ 200,00**
- Custo total: **R$ 200,00**
- Margem: R$ 797 - R$ 200 = **R$ 597,00** (75% de margem)

## Estratégias de Otimização

### 1. Maximizar Mensagens de Serviço

- **Responder rapidamente** às mensagens dos clientes (dentro de 24h)
- Usar o bot para **respostas automáticas** dentro da janela de 24h
- Manter conversas ativas para evitar expiração da janela

### 2. Usar Templates de Utilidade (não Marketing)

- Confirmações de pedidos → **Utilidade** (mais barato)
- Avisos de entrega → **Utilidade**
- Notas fiscais → **Utilidade**
- **Evitar** categorizar como Marketing quando possível

### 3. Monitoramento de Custos

- Implementar tracking de mensagens por categoria
- Alertar clientes sobre uso excessivo de mensagens pagas
- Dashboard de custos por tenant

### 4. Limites e Controles

- Implementar limites de mensagens por categoria
- Bloquear envio de Marketing fora de templates aprovados
- Notificar clientes quando aproximarem do limite

## Implementação Técnica

### Categorização Automática

O bot deve categorizar mensagens automaticamente:

```javascript
// Exemplos de categorização
- Resposta a dúvida do cliente → Serviço (gratuito)
- Confirmação de pedido → Utilidade ($0,0085)
- Aviso de entrega → Utilidade ($0,0085)
- Promoção/Oferta → Marketing ($0,0782)
- Código OTP → Autenticação ($0,0085)
```

### API WhatsApp Cloud

Ao enviar mensagens via Cloud API, especificar o tipo:

```json
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "text",
  "text": { "body": "Mensagem aqui" }
}
```

**Nota**: A categoria é determinada automaticamente pela Meta baseada em:
- Se está dentro da janela de 24h → Serviço (gratuito)
- Se usa template → Categoria do template (Marketing/Utilidade/Autenticação)
- Se é mensagem iniciada pela empresa → Requer template

## Alertas Importantes

⚠️ **Forma de Pagamento**: O WhatsApp Manager mostra alerta "Nenhuma forma de pagamento válida". É necessário adicionar forma de pagamento na conta Meta para enviar mensagens pagas.

⚠️ **Templates**: Mensagens fora da janela de 24h **precisam** usar templates aprovados. Sem templates, não é possível enviar mensagens iniciadas pela empresa.

⚠️ **Custos Ocultos**: Mensagens de Marketing são **9x mais caras** que Utilidade. Evitar usar Marketing quando Utilidade é suficiente.

## Referências

- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [WhatsApp Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)
- [WhatsApp Conversation Window](https://developers.facebook.com/docs/whatsapp/conversation-types)

## Próximos Passos

1. ✅ Documentar custos (este arquivo)
2. ⏳ Implementar tracking de mensagens por categoria
3. ⏳ Adicionar dashboard de custos no admin
4. ⏳ Criar alertas de uso excessivo
5. ⏳ Implementar limites por categoria nos planos
