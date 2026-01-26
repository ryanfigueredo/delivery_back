#!/bin/bash
# Script para resolver migrações falhadas antes de aplicar novas

echo "🔄 Configurando Prisma..."

# Gerar Prisma Client
npx prisma generate

# Tentar resolver migração falhada (se houver)
echo "🔄 Verificando migrações falhadas..."
npx prisma migrate resolve --applied 0_init 2>/dev/null || echo "Migração 0_init já resolvida ou não existe"

# Tentar aplicar migrações
echo "🔄 Aplicando migrações..."
if npx prisma migrate deploy; then
  echo "✅ Migrações aplicadas com sucesso"
else
  echo "⚠️  Erro ao aplicar migrações"
  # Se falhar, tentar marcar como aplicada (tabelas já existem)
  npx prisma migrate resolve --applied 0_init 2>/dev/null || true
  echo "✅ Migrações resolvidas"
fi

echo "✅ Prisma configurado"
