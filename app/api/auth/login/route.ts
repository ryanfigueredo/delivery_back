import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, createSession } from '@/lib/auth-session'

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

    // Criar sessão
    await createSession(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
