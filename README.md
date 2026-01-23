# saas-sales-api-nodejs

Backend da API do **SaaS de Vendas Automatizadas**. Núcleo central que orquestra pedidos, autenticação, filas de impressão e integração com WhatsApp, app mobile e módulo de impressão.

---

## Arquitetura

- **Runtime:** Node.js + TypeScript  
- **Framework:** Next.js 14 (App Router + API Routes)  
- **ORM:** Prisma  
- **Banco:** PostgreSQL  
- **Deploy:** Vercel (serverless)

A API segue um desenho modular por domínio: rotas em `/api/*` por recurso (auth, orders, printer, webhook, admin), com `middleware` global para rate limiting e proteção de rotas.

---

## Segurança

### Autenticação

- **Dashboard (web):** sessão via cookie `httpOnly`, `secure` em produção, `sameSite: lax`, bcrypt para senhas.
- **APIs (mobile, impressora, integrações):** `X-API-Key` em todas as requisições. Comparação *timing-safe* para mitigar timing attacks.

### Rate limiting

- Limite em memória (100 req/min por IP) nas rotas de API, exceto `/api/auth/*`.
- Em produção, recomenda-se Redis ou similar para rate limit distribuído.

### Webhook WhatsApp

- Validação e sanitização dos dados recebidos (nome, telefone, itens, totais).
- Limite de tamanho e caracteres em strings, validação de totais vs soma dos itens.
- Prisma + prepared statements para evitar SQL injection; JSONB sanitizado antes de persistir.

---

## Banco de Dados (PostgreSQL + Prisma)

### Modelos principais

| Modelo | Descrição |
|--------|-----------|
| `Order` | Pedidos: cliente, itens (JSONB), total, status, `display_id`, tipo (restaurante/delivery), endereço, etc. |
| `User` | Usuários do dashboard: `username`, hash de senha, `role`. |

### Status do pedido

`pending` → `printed` → `out_for_delivery` / `finished`

Migrações: `prisma migrate dev` (local) ou `prisma migrate deploy` (produção).

---

## Filas de impressão e integração com o app Kotlin

O backend **não** mantém fila em Redis ou tabela dedicada. A “fila” é implícita:

1. **Fonte dos pedidos:** Webhook WhatsApp (ou outra integração) cria `Order` com `status: pending`.
2. **Próximo da fila:**  
   - `GET /api/orders/next-to-print` — retorna o **primeiro** pedido `pending` ordenado por `created_at` (FIFO).  
   - Usado pelo **app Kotlin** (impressora) via polling.
3. **Impressão realizada:**  
   - O app Kotlin chama `PATCH /api/orders/:id/status` com `{ "status": "printed" }`.  
   - O pedido sai da “fila” lógica (não é mais retornado por `next-to-print`).
4. **Alternativa:**  
   - `GET /api/printer/pending-prints` — retorna o próximo pedido pendente (mesma lógica, formato compatível com maquininha).
5. **Comando de impressão (app mobile):**  
   - `POST /api/printer/print` — recebe `orderId`, `printerDeviceId`, `printerIp`.  
   - Hoje não envia comando direto para hardware; a impressora **busca** os pedidos via `next-to-print` ou `pending-prints`.

Resumo: a fila é “query-based” (pedidos `pending` ordenados por `created_at`). O app Kotlin faz polling, imprime e confirma via `PATCH /status`. O app mobile pode acionar lógica adicional via `/api/printer/print`, mas a retirada da fila segue o mesmo fluxo.

---

## Principais endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/login` | Login (credenciais → sessão) | — |
| `GET` | `/api/orders` | Lista pedidos (paginado) | opcional API Key |
| `GET` | `/api/orders/next-to-print` | Próximo pedido para impressão | API Key |
| `GET` | `/api/printer/pending-prints` | Pendentes para impressora | API Key |
| `POST` | `/api/printer/print` | Comando de impressão (orderId, device) | API Key |
| `PATCH` | `/api/orders/:id/status` | Atualizar status (ex.: `printed`) | API Key |
| `PATCH` | `/api/orders/:id/mark-out-for-delivery` | Marcar saiu para entrega | API Key |
| `POST` | `/api/orders/:id/notify-delivery` | Notificar cliente (ex.: WhatsApp) | API Key |
| `POST` | `/api/webhook/whatsapp` | Receber pedidos do bot WhatsApp | — |

Rotas em `/api/admin/*` (menu, store-hours, priority-conversations) seguem o mesmo esquema de autenticação usado no resto da API.

---

## Variáveis de ambiente

```bash
DATABASE_URL="postgresql://..."
API_KEY="sua-api-key-segura"
# NODE_ENV=production no deploy
```

`API_KEY`: mesma chave usada pelo app Expo e pelo app Kotlin no header `X-API-Key`.

---

## Scripts

```bash
npm install
npx prisma generate
npx prisma migrate dev    # local
npx prisma migrate deploy # produção
npm run dev               # Next.js dev
npm run build && npm run start
npx prisma studio         # UI do banco
```

---

## Licença

Projeto privado. Uso interno ou conforme acordos do produto.
