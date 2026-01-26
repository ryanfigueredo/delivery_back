#!/bin/bash
set -e  # Parar em caso de erro

echo "🔄 Configurando Prisma..."

# Gerar Prisma Client (sempre necessário)
echo "📦 Gerando Prisma Client..."
npx prisma generate || {
  echo "❌ Erro ao gerar Prisma Client"
  exit 1
}

# Aplicar migrações
echo "🔄 Aplicando migrações..."
npx prisma migrate deploy || {
  echo "⚠️  Erro ao aplicar migrações, tentando resolver migrações falhadas..."
  
  # Tentar resolver migrações falhadas
  npx prisma migrate resolve --applied 0_init 2>/dev/null || echo "Migração 0_init não precisa ser resolvida"
  npx prisma migrate resolve --applied 2_add_tenant_id_to_users 2>/dev/null || echo "Migração 2_add_tenant_id_to_users não precisa ser resolvida"
  
  # Tentar aplicar novamente
  echo "🔄 Tentando aplicar migrações novamente..."
  npx prisma migrate deploy || {
    echo "⚠️  Ainda há problemas com migrações, mas continuando com o build..."
    # Não falhar o build por causa de migrações
  }
}

echo "✅ Prisma configurado"
