/**
 * Script para criar dados iniciais:
 * - 2 Tenants (Tamboril Burguer e Restaurante 2)
 * - Usuário master (ryan@dmtn.com.br)
 * - Usuários para cada restaurante
 * 
 * Execute: npx tsx scripts/setup-initial-data.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function generateApiKey(): Promise<string> {
  return crypto.randomBytes(32).toString('hex')
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function setupInitialData() {
  try {
    console.log('🔄 Configurando dados iniciais...\n')

    // 1. Criar Tenant 1: Tamboril Burguer
    console.log('📦 Criando tenant: Tamboril Burguer...')
    const tenant1 = await prisma.tenant.upsert({
      where: { slug: 'tamboril-burguer' },
      update: {},
      create: {
        name: 'Tamboril Burguer',
        slug: 'tamboril-burguer',
        api_key: 'tamboril-burguer-api-key-2024-secure',
        is_active: true,
      },
    })
    console.log(`✅ Tenant criado: ${tenant1.name} (ID: ${tenant1.id})`)
    console.log(`   API Key: ${tenant1.api_key}\n`)

    // 2. Criar Tenant 2: Restaurante 2
    console.log('📦 Criando tenant: Restaurante 2...')
    const tenant2ApiKey = await generateApiKey()
    const tenant2 = await prisma.tenant.upsert({
      where: { slug: 'restaurante-2' },
      update: {},
      create: {
        name: 'Restaurante 2',
        slug: 'restaurante-2',
        api_key: tenant2ApiKey,
        is_active: true,
      },
    })
    console.log(`✅ Tenant criado: ${tenant2.name} (ID: ${tenant2.id})`)
    console.log(`   API Key: ${tenant2.api_key}\n`)

    // 3. Criar Usuário Master (super admin)
    console.log('👤 Criando usuário master...')
    const existingMaster = await prisma.user.findFirst({
      where: {
        username: 'ryan@dmtn.com.br',
        tenant_id: null,
      },
    })
    
    let masterUser
    if (existingMaster) {
      masterUser = existingMaster
      console.log('✅ Usuário master já existe')
    } else {
      const masterPassword = await hashPassword('123456')
      masterUser = await prisma.user.create({
        data: {
          username: 'ryan@dmtn.com.br',
          password: masterPassword,
          name: 'Ryan (Master)',
          role: 'super_admin',
          tenant_id: null, // Super admin não tem tenant
        },
      })
      console.log(`✅ Usuário master criado: ${masterUser.username}`)
    }
    console.log(`✅ Usuário master criado: ${masterUser.username}`)
    console.log(`   Senha: 123456\n`)

    // 4. Criar Usuário para Tamboril Burguer
    console.log('👤 Criando usuário para Tamboril Burguer...')
    const user1Password = await hashPassword('123456')
    const user1 = await prisma.user.upsert({
      where: {
        tenant_id_username: {
          tenant_id: tenant1.id,
          username: 'admin@tamboril.com'
        }
      },
      update: {},
      create: {
        tenant_id: tenant1.id,
        username: 'admin@tamboril.com',
        password: user1Password,
        name: 'Admin Tamboril',
        role: 'admin',
      },
    })
    console.log(`✅ Usuário criado: ${user1.username}`)
    console.log(`   Senha: 123456\n`)

    // 5. Criar Usuário para Restaurante 2
    console.log('👤 Criando usuário para Restaurante 2...')
    const user2Password = await hashPassword('123456')
    const user2 = await prisma.user.upsert({
      where: {
        tenant_id_username: {
          tenant_id: tenant2.id,
          username: 'admin@restaurante2.com'
        }
      },
      update: {},
      create: {
        tenant_id: tenant2.id,
        username: 'admin@restaurante2.com',
        password: user2Password,
        name: 'Admin Restaurante 2',
        role: 'admin',
      },
    })
    console.log(`✅ Usuário criado: ${user2.username}`)
    console.log(`   Senha: 123456\n`)

    console.log('═══════════════════════════════════════')
    console.log('✅ Setup completo!')
    console.log('═══════════════════════════════════════\n')
    
    console.log('📋 RESUMO:\n')
    console.log('👑 MASTER (Super Admin):')
    console.log('   Email: ryan@dmtn.com.br')
    console.log('   Senha: 123456')
    console.log('   Acesso: /admin (Dashboard Master)\n')
    
    console.log('🍔 TAMBORIL BURGUER:')
    console.log(`   Tenant ID: ${tenant1.id}`)
    console.log(`   Slug: ${tenant1.slug}`)
    console.log(`   API Key: ${tenant1.api_key}`)
    console.log('   Usuário: admin@tamboril.com')
    console.log('   Senha: 123456\n')
    
    console.log('🍽️ RESTAURANTE 2:')
    console.log(`   Tenant ID: ${tenant2.id}`)
    console.log(`   Slug: ${tenant2.slug}`)
    console.log(`   API Key: ${tenant2.api_key}`)
    console.log('   Usuário: admin@restaurante2.com')
    console.log('   Senha: 123456\n')

  } catch (error) {
    console.error('❌ Erro ao configurar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupInitialData()
