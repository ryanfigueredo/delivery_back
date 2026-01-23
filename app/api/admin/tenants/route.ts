import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-session'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é super admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (user?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    // Buscar todos os tenants com contagem de pedidos e usuários
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            users: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({
      success: true,
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        is_active: t.is_active,
        created_at: t.created_at.toISOString(),
        _count: t._count,
      })),
    })
  } catch (error) {
    console.error('Erro ao buscar tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se é super admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    })

    if (user?.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas super admin.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug, createUser, username, password, userName } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug já existe. Escolha outro.' },
        { status: 400 }
      )
    }

    // Gerar API key
    const apiKey = crypto.randomBytes(32).toString('hex')

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        api_key: apiKey,
        is_active: true,
      },
    })

    // Criar usuário se solicitado
    if (createUser && username && password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({
        data: {
          tenant_id: tenant.id,
          username,
          password: hashedPassword,
          name: userName || username,
          role: 'admin',
        },
      })
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        api_key: tenant.api_key,
      },
    })
  } catch (error) {
    console.error('Erro ao criar tenant:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar tenant' },
      { status: 500 }
    )
  }
}
