# 📋 Guia de Migrations do Prisma

## ⚠️ Importante

As migrations **NÃO** são aplicadas automaticamente durante o build no Vercel. Elas devem ser aplicadas manualmente ou via CI/CD antes do deploy.

## 🔄 Como Aplicar Migrations

### Opção 1: Via CLI Local

```bash
# Conectar ao banco de produção e aplicar migrations
npx prisma migrate deploy
```

### Opção 2: Via Vercel CLI

```bash
# Aplicar migrations antes do deploy
vercel env pull .env.production
npx prisma migrate deploy
```

### Opção 3: Via Script de Deploy

Criar um script que aplica migrations antes do deploy:

```bash
#!/bin/bash
# scripts/pre-deploy.sh
npx prisma migrate deploy
```

## 📝 Migration Pendente

**Migration:** `20250205000001_add_subscription_fields`

**Campos adicionados:**
- `subscription_payment_date` (TIMESTAMP)
- `subscription_expires_at` (TIMESTAMP)
- `asaas_subscription_id` (TEXT)
- `asaas_customer_id` (TEXT)
- `subscription_status` (TEXT, default: 'active')

**SQL:**
```sql
ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "subscription_payment_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "asaas_subscription_id" TEXT,
ADD COLUMN IF NOT EXISTS "asaas_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_status" TEXT DEFAULT 'active';
```

## ✅ Verificar Status das Migrations

```bash
npx prisma migrate status
```

## 🚨 Troubleshooting

Se o build falhar por causa de migrations:

1. Verificar se todas as migrations foram aplicadas:
   ```bash
   npx prisma migrate status
   ```

2. Se houver migrations pendentes, aplicá-las:
   ```bash
   npx prisma migrate deploy
   ```

3. Se o schema estiver desatualizado, sincronizar:
   ```bash
   npx prisma db push
   ```
   ⚠️ **Cuidado:** `db push` não cria migrations, apenas sincroniza o schema.
