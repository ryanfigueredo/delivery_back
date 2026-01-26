import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forçar rota dinâmica (não pode ser renderizada estaticamente)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verificar se tabela orders existe
    let ordersTableExists = false
    try {
      const tableCheck = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
        LIMIT 1
      `)
      ordersTableExists = tableCheck.length > 0
    } catch (error) {
      console.log('Erro ao verificar tabela orders:', error)
      ordersTableExists = false
    }

    if (!ordersTableExists) {
      // Tabela orders não existe, retornar lista vazia
      return NextResponse.json({
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      }, { status: 200 })
    }

    // Obter tenant_id do header, API key ou Basic Auth
    let tenantId: string | null = null
    
    // Verificar Basic Auth primeiro (para apps mobile com login)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const base64Credentials = authHeader.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
        const [username, password] = credentials.split(':')
        
        if (username && password) {
          const { verifyCredentials } = await import('@/lib/auth-session')
          const user = await verifyCredentials(username, password)
          if (user) {
            console.log('✅ Usuário autenticado via Basic Auth:', user.id, 'tenant_id:', user.tenant_id)
            // Usar tenant_id do user retornado (já vem do verifyCredentials)
            if (user.tenant_id) {
              tenantId = user.tenant_id
            } else {
              // Se não tem no user, buscar do banco usando SQL direto (fallback)
              try {
                const users = await prisma.$queryRawUnsafe<Array<{ tenant_id: string | null }>>(`
                  SELECT tenant_id FROM users WHERE id = $1 LIMIT 1
                `, user.id)
                if (users.length > 0 && users[0].tenant_id) {
                  tenantId = users[0].tenant_id
                  console.log('✅ Tenant_id obtido do banco:', tenantId)
                }
              } catch (dbError: any) {
                console.error('Erro ao buscar tenant_id do usuário:', dbError)
                // Se der erro P2022, tentar buscar sem tenant_id (pode não existir a coluna ainda)
                if (dbError?.code === 'P2022') {
                  console.log('⚠️  Coluna tenant_id não existe, tentando buscar tenant pelo slug...')
                  // Buscar tenant pelo slug do app
                  const tenantSlug = request.headers.get('x-tenant-id') || 'tamboril-burguer'
                  try {
                    const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
                      SELECT id FROM tenants WHERE slug = $1 LIMIT 1
                    `, tenantSlug)
                    if (tenants.length > 0) {
                      tenantId = tenants[0].id
                      console.log('✅ Tenant_id obtido pelo slug:', tenantId)
                    }
                  } catch (tenantError) {
                    console.error('Erro ao buscar tenant pelo slug:', tenantError)
                  }
                }
              }
            }
          } else {
            console.log('❌ Credenciais inválidas no Basic Auth')
          }
        }
      } catch (error) {
        console.error('Erro ao processar Basic Auth:', error)
        // Ignorar erro de parsing
      }
    }
    
    // Se não conseguiu pelo Basic Auth, tentar header ou API key
    if (!tenantId) {
      const tenantIdHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id')
      if (tenantIdHeader) {
        // Se for um UUID, usar diretamente. Se for slug, buscar o ID
        if (tenantIdHeader.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          tenantId = tenantIdHeader
        } else {
          // É um slug, buscar o ID do tenant
          try {
            const { getTenantByApiKey } = await import('@/lib/tenant')
            const tenant = await getTenantByApiKey(tenantIdHeader)
            if (tenant) {
              tenantId = tenant.id
            } else {
              // Tentar buscar pelo slug diretamente
              const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
                SELECT id FROM tenants WHERE slug = $1 LIMIT 1
              `, tenantIdHeader)
              if (tenants.length > 0) {
                tenantId = tenants[0].id
              }
            }
          } catch (error) {
            console.error('Erro ao buscar tenant pelo header:', error)
          }
        }
      } else {
        // Tentar obter pela API key
        const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
        if (apiKey) {
          try {
            const { getTenantByApiKey } = await import('@/lib/tenant')
            const tenant = await getTenantByApiKey(apiKey)
            if (tenant) {
              tenantId = tenant.id
            }
          } catch (error) {
            console.error('Erro ao buscar tenant pela API key:', error)
          }
        }
      }
    }

    // Último fallback: usar tenant padrão se não conseguir identificar
    if (!tenantId) {
      console.error('❌ Tenant não identificado. Headers:', {
        'x-tenant-id': request.headers.get('x-tenant-id'),
        'X-Tenant-Id': request.headers.get('X-Tenant-Id'),
        'x-api-key': request.headers.get('x-api-key') ? 'presente' : 'ausente',
        'authorization': request.headers.get('authorization') ? 'presente' : 'ausente',
      })
      
      // Tentar buscar tenant padrão (tamboril-burguer) como último recurso
      try {
        const defaultTenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`
          SELECT id FROM tenants WHERE slug = 'tamboril-burguer' LIMIT 1
        `)
        if (defaultTenants.length > 0) {
          tenantId = defaultTenants[0].id
          console.log('⚠️  Usando tenant padrão (tamboril-burguer) como fallback:', tenantId)
        } else {
          return NextResponse.json(
            { message: 'Tenant não identificado. Forneça X-Tenant-Id no header, X-API-Key válida ou Basic Auth.' },
            { status: 400 }
          )
        }
      } catch (fallbackError: any) {
        // Se der erro, retornar lista vazia em vez de erro 500
        if (fallbackError?.code === 'P2022' || fallbackError?.code === 'P2021') {
          console.log('⚠️  Tabela tenants não existe, retornando lista vazia')
          return NextResponse.json({
            orders: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasMore: false,
            },
          }, { status: 200 })
        }
        return NextResponse.json(
          { message: 'Tenant não identificado. Forneça X-Tenant-Id no header, X-API-Key válida ou Basic Auth.' },
          { status: 400 }
        )
      }
    }
    
    console.log('✅ Tenant identificado:', tenantId)

    // Opcional: validar API_KEY para admin (pode remover se quiser público)
    const apiKeyHeader = request.headers.get('X-API-Key')
    const isAdmin = apiKeyHeader === process.env.API_KEY

    // Paginação
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Contar total de pedidos do tenant - com tratamento de erro
    let total = 0
    let orders: any[] = []
    
    try {
      total = await prisma.order.count({
        where: {
          tenant_id: tenantId,
          ...(isAdmin ? {} : {
            status: {
              in: ['pending', 'printed'],
            },
          }),
        },
      })

      orders = await prisma.order.findMany({
        where: {
          tenant_id: tenantId,
          // Se for admin, mostra todos os status. Se não, só pending/printed
          ...(isAdmin ? {} : {
            status: {
              in: ['pending', 'printed'],
            },
          }),
        },
        orderBy: {
          created_at: 'desc', // Mais recentes primeiro
        },
        skip,
        take: limit,
      })
    } catch (orderError: any) {
      console.error('Erro ao buscar pedidos:', orderError)
      if (orderError?.code === 'P2022' || orderError?.code === 'P2021') {
        // Tabela ou coluna não existe, retornar lista vazia
        return NextResponse.json({
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        }, { status: 200 })
      }
      throw orderError
    }

    // Formatar os dados para o formato esperado pelo app
    const formattedOrders = orders.map((order) => {
      // Converter items de JSON para array se necessário
      let items = order.items
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items)
        } catch (e) {
          items = []
        }
      }
      if (!Array.isArray(items)) {
        items = []
      }

      // Converter total_price para number se necessário
      let totalPrice: number = 0
      const rawTotalPrice = order.total_price
      
      if (typeof rawTotalPrice === 'string') {
        totalPrice = parseFloat(rawTotalPrice)
      } else if (rawTotalPrice && typeof rawTotalPrice === 'object' && 'toNumber' in rawTotalPrice) {
        totalPrice = (rawTotalPrice as any).toNumber()
      } else if (rawTotalPrice === null || rawTotalPrice === undefined) {
        totalPrice = 0
      } else if (typeof rawTotalPrice === 'number') {
        totalPrice = rawTotalPrice
      }
      
      // Garantir que é um número válido
      if (typeof totalPrice !== 'number' || isNaN(totalPrice)) {
        totalPrice = 0
      }

      return {
        id: order.id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: items.map((item: any) => ({
          id: item.id || item.name,
          name: item.name,
          quantity: item.quantity || 1,
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        })),
        total_price: totalPrice,
        status: order.status,
        created_at: order.created_at.toISOString(),
        display_id: order.display_id,
        daily_sequence: order.daily_sequence,
        order_type: order.order_type,
        delivery_address: order.delivery_address,
        payment_method: order.payment_method,
        estimated_time: order.estimated_time,
      }
    })

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error)
    console.error('Detalhes do erro:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    
    // SEMPRE retornar lista vazia em caso de erro (nunca erro 500 em produção)
    // Isso garante que o app não quebre mesmo se houver problemas no banco
    return NextResponse.json({
      orders: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }, { status: 200 })
  }
}
