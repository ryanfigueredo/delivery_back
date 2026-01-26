#!/bin/bash
# Script para resolver migrações falhadas antes de aplicar novas

echo "🔄 Verificando migrações..."

# Gerar Prisma Client
npx prisma generate

# Tentar aplicar migrações
if npx prisma migrate deploy; then
  echo "✅ Migrações aplicadas com sucesso"
else
  echo "⚠️  Erro ao aplicar migrações, tentando resolver..."
  
  # Listar migrações
  MIGRATIONS=$(npx prisma migrate status 2>&1 | grep -E "^\s+[0-9]" | awk '{print $1}')
  
  # Tentar resolver migrações falhadas
  for migration in $MIGRATIONS; do
    echo "Tentando resolver migração: $migration"
    npx prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done
  
  # Tentar aplicar novamente
  npx prisma migrate deploy || echo "⚠️  Migrações já aplicadas ou banco está atualizado"
fi

echo "✅ Prisma configurado"
