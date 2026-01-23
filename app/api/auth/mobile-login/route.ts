import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * API de login para apps mobile
 * Retorna as informações do usuário sem criar sessão (cookies não funcionam bem em apps)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar credenciais
    const user = await verifyCredentials(username, password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Buscar informações completas do usuário
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        tenant_id: true,
      },
    })

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser.id,
        username: fullUser.username,
        name: fullUser.name,
        role: fullUser.role,
        tenant_id: fullUser.tenant_id,
      },
    })
  } catch (error) {
    console.error('Erro no login mobile:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
