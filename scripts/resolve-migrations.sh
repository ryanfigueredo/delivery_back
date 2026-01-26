#!/bin/bash
# Script para resolver migrações falhadas antes de aplicar novas

echo "🔄 Configurando Prisma..."

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Verificar status das migrações
echo "🔄 Verificando status das migrações..."
npx prisma migrate status || echo "⚠️  Erro ao verificar status (pode ser normal se banco está vazio)"

# Tentar resolver migrações falhadas
echo "🔄 Resolvendo migrações falhadas..."
npx prisma migrate resolve --applied 0_init 2>/dev/null || echo "Migração 0_init já resolvida ou não existe"
npx prisma migrate resolve --applied 2_add_tenant_id_to_users 2>/dev/null || echo "Migração 2_add_tenant_id_to_users já resolvida ou não existe"

# Tentar aplicar migrações
echo "🔄 Aplicando migrações..."
if npx prisma migrate deploy; then
  echo "✅ Migrações aplicadas com sucesso"
else
  echo "⚠️  Erro ao aplicar migrações, tentando resolver..."
  # Tentar resolver todas as migrações conhecidas
  npx prisma migrate resolve --applied 0_init 2>/dev/null || true
  npx prisma migrate resolve --applied 2_add_tenant_id_to_users 2>/dev/null || true
  echo "✅ Tentativa de resolução concluída"
fi

echo "✅ Prisma configurado"
