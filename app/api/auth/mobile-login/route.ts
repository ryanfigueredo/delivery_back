import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

/**
 * API de login para apps mobile
 * Retorna as informações do usuário sem criar sessão (cookies não funcionam bem em apps)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar conexão com banco primeiro
    try {
      await prisma.$connect()
    } catch (dbError: any) {
      console.error('Erro ao conectar ao banco:', dbError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro de conexão com o banco de dados',
          details: process.env.NODE_ENV !== 'production' ? dbError.message : undefined
        },
        { status: 500 }
      )
    }

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
      console.error('Stack:', verifyError?.stack)
      
      // Se for erro de conexão, retornar erro específico
      if (verifyError?.code === 'P1001' || verifyError?.message?.includes('connect')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro de conexão com o banco de dados',
            details: process.env.NODE_ENV !== 'production' ? verifyError.message : undefined
          },
          { status: 500 }
        )
      }
      
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
      console.error('Código do erro:', prismaError?.code)
      console.error('Mensagem:', prismaError?.message)
      
      // Se for erro de conexão ou tabela não existe
      if (prismaError?.code === 'P1001' || prismaError?.code === 'P2021') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Erro de conexão com o banco de dados',
            details: process.env.NODE_ENV !== 'production' ? prismaError.message : undefined
          },
          { status: 500 }
        )
      }
      
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
      code: error?.code,
    })
    
    // Verificar tipo de erro
    let errorMessage = 'Erro interno do servidor'
    let statusCode = 500
    
    if (error?.code === 'P1001') {
      errorMessage = 'Erro de conexão com o banco de dados'
    } else if (error?.code === 'P2021') {
      errorMessage = 'Tabela não encontrada no banco de dados'
    } else if (error?.message) {
      errorMessage = process.env.NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : error.message
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { 
          details: error?.stack,
          code: error?.code 
        })
      },
      { status: statusCode }
    )
  } finally {
    // Desconectar do Prisma
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      // Ignorar erro ao desconectar
    }
  }
}
