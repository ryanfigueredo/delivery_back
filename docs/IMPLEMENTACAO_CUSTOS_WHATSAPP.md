# Implementação: Tracking de Custos WhatsApp

## ✅ Funcionalidades Implementadas

### 1. Schema de Banco de Dados
- ✅ Adicionado modelo `WhatsAppMessage` para rastreamento detalhado de cada mensagem
- ✅ Adicionados campos de categoria ao `MessageUsage`:
  - `messages_service` (gratuitas)
  - `messages_utility` (R$ 0,05 cada)
  - `messages_marketing` (R$ 0,40 cada)
  - `messages_auth` (R$ 0,05 cada)
  - `total_cost_brl` (custo total do mês)

### 2. Biblioteca de Custos (`lib/whatsapp-costs.ts`)
- ✅ Função `calculateCost()` - Calcula custo por categoria
- ✅ Função `logWhatsAppMessage()` - Registra mensagem com categoria e custo
- ✅ Função `getWhatsAppCosts()` - Obtém estatísticas de um tenant
- ✅ Função `getAllTenantsCosts()` - Obtém custos de todos os tenants (admin)

### 3. APIs Criadas
- ✅ `GET /api/admin/whatsapp-costs` - Lista custos de todos os tenants
- ✅ `GET /api/admin/whatsapp-costs/[tenantId]` - Detalhes de um tenant específico

### 4. Dashboard de Custos (`/admin/custos-whatsapp`)
- ✅ Visão geral com cards de estatísticas:
  - Custo Total
  - Total de Mensagens
  - Custo Médio por Mensagem
- ✅ Tabela de custos por cliente com:
  - Nome do cliente
  - Plano
  - Total de mensagens
  - Custo total
  - Breakdown por categoria
- ✅ Alertas visuais:
  - ⚠️ Atenção: Custo acima do recomendado (>R$ 50 Básico, >R$ 100 Completo, >R$ 200 Premium)
  - ⚠️ Crítico: Custo >150% do limite recomendado
- ✅ Filtros por mês/ano
- ✅ Visualização detalhada por tenant com:
  - Breakdown por categoria
  - Últimas 50 mensagens enviadas

### 5. Alertas de Uso Excessivo
- ✅ Banner de alerta quando há clientes com custos acima do recomendado
- ✅ Indicadores visuais na tabela (cores e badges)
- ✅ Percentual do limite recomendado exibido

### 6. Página de Vendas Responsiva
- ✅ Versão desktop: Tabela comparativa completa
- ✅ Versão mobile/tablet: Cards verticais com todas as informações
- ✅ Layout adaptativo usando Tailwind CSS (`lg:hidden`, `hidden lg:block`)

### 7. Análise de Planos
- ✅ Documento `ANALISE_PLANOS_CUSTOS.md` criado
- ✅ Conclusão: **Planos estão adequados** com margens de 87-95%

## 📊 Estrutura de Dados

### WhatsAppMessage
```typescript
{
  id: string
  tenant_id: string
  to_phone: string
  category: 'SERVICE' | 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
  cost_usd: Decimal
  cost_brl: Decimal
  message_type?: string
  template_name?: string
  within_24h_window: boolean
  created_at: DateTime
}
```

### MessageUsage (atualizado)
```typescript
{
  id: string
  tenant_id: string
  month: number
  year: number
  messages_sent: number
  messages_service: number
  messages_utility: number
  messages_marketing: number
  messages_auth: number
  total_cost_brl: Decimal
}
```

## 🔄 Próximos Passos (Opcional)

### Para Implementação Completa:
1. ⏳ Modificar funções de envio de mensagens para chamar `logWhatsAppMessage()`
   - `bot/cloud-api-handler.js`
   - `desktop/app/api/admin/send-whatsapp/route.ts`
   - Outros endpoints que enviam WhatsApp

2. ⏳ Implementar detecção automática de categoria:
   - Analisar conteúdo da mensagem
   - Verificar se está dentro da janela de 24h
   - Identificar tipo de template usado

3. ⏳ Adicionar limites por categoria nos planos:
   - Limite de Marketing por plano
   - Alertas quando aproximar do limite

4. ⏳ Dashboard para clientes:
   - Mostrar seus próprios custos
   - Sugestões de otimização

## 📝 Notas Importantes

### Categorização de Mensagens
A categorização atual é manual. Para automatizar:
- **SERVICE**: Respostas dentro de 24h após mensagem do cliente
- **UTILITY**: Confirmações, avisos, notas fiscais (templates de utilidade)
- **MARKETING**: Promoções, ofertas (templates de marketing)
- **AUTHENTICATION**: Códigos OTP, senhas (templates de autenticação)

### Custos
- Taxa de conversão USD -> BRL: 5.0 (pode ser atualizada via API)
- Custos por categoria conforme documentação WhatsApp Business API

### Migration
A migration foi criada em:
`desktop/prisma/migrations/20260206000000_add_whatsapp_message_tracking/migration.sql`

**Para aplicar**: Execute `npx prisma migrate deploy` em produção ou `npx prisma migrate dev` em desenvolvimento.

## 🎯 Como Usar

1. **Acessar Dashboard de Custos**:
   - Login como super admin (`ryan@dmtn.com.br`)
   - Navegar para `/admin/custos-whatsapp`

2. **Visualizar Custos**:
   - Selecionar mês/ano
   - Ver tabela de custos por cliente
   - Clicar em "Ver Detalhes" para breakdown completo

3. **Identificar Problemas**:
   - Clientes com badge "⚠️ Crítico" precisam atenção imediata
   - Clientes com badge "⚠️ Atenção" devem ser monitorados

## 📚 Documentação Relacionada

- `CUSTOS_WHATSAPP.md` - Documentação técnica completa
- `RESUMO_CUSTOS_WHATSAPP.md` - Resumo executivo
- `ANALISE_PLANOS_CUSTOS.md` - Análise financeira dos planos
