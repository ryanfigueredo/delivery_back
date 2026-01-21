# ⚡ Tamboril Burguer - Backend/API

Backend Next.js que será deployado no Vercel.

## 🚀 Deploy no Vercel

1. Conecte este repositório ao Vercel
2. Configure o **Root Directory** como `vercel-app`
3. Configure variáveis de ambiente:
   - `DATABASE_URL`
   - `API_KEY`
4. Deploy automático a cada push!

## 📁 Estrutura

```
vercel-app/
├── app/              # Next.js App Router
│   ├── api/          # API Routes
│   └── dashboard/    # Dashboard web
├── components/       # Componentes React
├── lib/              # Utilitários
├── prisma/           # Schema e migrations
└── types/            # TypeScript types
```

## 🔧 Comandos

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Iniciar produção
npm run prisma:push  # Atualizar banco
```

## 📡 APIs Disponíveis

- `POST /api/webhook/whatsapp` - Recebe pedidos do bot
- `GET /api/orders` - Lista pedidos
- `GET /api/orders/next-to-print` - Próximo pedido para imprimir
- `PATCH /api/orders/{id}/mark-printed` - Marcar como impresso
- `GET /api/admin/store-hours` - Status da loja
- `POST /api/admin/store-hours` - Atualizar status
- `GET /api/admin/menu` - Cardápio
- `PUT /api/admin/menu` - Atualizar cardápio

## 🔐 Autenticação

Todas as APIs admin requerem header:
```
X-API-Key: sua-api-key
```
