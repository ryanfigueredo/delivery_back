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
    const { username, password, email } = body

    // Aceitar username ou email
    const loginIdentifier = username || email

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Tentativa de login:', { loginIdentifier, hasPassword: !!password })

    // Verificar credenciais
    let user
    try {
      user = await verifyCredentials(loginIdentifier, password)
    } catch (verifyError: any) {
      console.error('Erro ao verificar credenciais:', verifyError)
      throw verifyError
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Buscar informações completas do usuário
    let fullUser
    try {
      fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          tenant_id: true,
        },
      })
    } catch (prismaError: any) {
      console.error('Erro ao buscar usuário no Prisma:', prismaError)
      throw new Error(`Erro ao buscar usuário: ${prismaError.message}`)
    }

    if (!fullUser) {
      console.error('Usuário não encontrado após verificação:', user.id)
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
  } catch (error: any) {
    console.error('Erro no login mobile:', error)
    // Log detalhado do erro para debug
    console.error('Detalhes do erro:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    // Retornar mensagem de erro mais específica em desenvolvimento
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : error?.message || 'Erro interno do servidor'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { details: error?.stack })
      },
      { status: 500 }
    )
  }
}
