/**
 * Script para criar usuário administrador
 * 
 * Uso: node scripts/create-admin-user.js <username> <password> <name>
 * Exemplo: node scripts/create-admin-user.js admin senha123 "Administrador"
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  const username = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || username

  if (!username || !password) {
    console.error('❌ Por favor, forneça username e senha')
    console.error('   Uso: node scripts/create-admin-user.js <username> <password> [name]')
    console.error('   Exemplo: node scripts/create-admin-user.js admin senha123 "Administrador"')
    process.exit(1)
  }

  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      console.error(`❌ Usuário "${username}" já existe`)
      process.exit(1)
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'admin',
      },
    })

    console.log('✅ Usuário criado com sucesso!')
    console.log(`   ID: ${user.id}`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Role: ${user.role}`)
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
