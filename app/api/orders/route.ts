import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forçar rota dinâmica (não pode ser renderizada estaticamente)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Obter tenant_id do header ou API key
    let tenantId: string | null = null
    
    const tenantIdHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-Id')
    if (tenantIdHeader) {
      tenantId = tenantIdHeader
    } else {
      // Tentar obter pela API key
      const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
      if (apiKey) {
        const { getTenantByApiKey } = await import('@/lib/tenant')
        const tenant = await getTenantByApiKey(apiKey)
        if (tenant) {
          tenantId = tenant.id
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { message: 'Tenant não identificado. Forneça X-Tenant-Id no header ou X-API-Key válida.' },
        { status: 400 }
      )
    }

    // Opcional: validar API_KEY para admin (pode remover se quiser público)
    const authHeader = request.headers.get('X-API-Key')
    const isAdmin = authHeader === process.env.API_KEY

    // Paginação
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Contar total de pedidos do tenant
    const total = await prisma.order.count({
      where: {
        tenant_id: tenantId,
        ...(isAdmin ? {} : {
          status: {
            in: ['pending', 'printed'],
          },
        }),
      },
    })

    const orders = await prisma.order.findMany({
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
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos', error: String(error) },
      { status: 500 }
    )
  }
}
