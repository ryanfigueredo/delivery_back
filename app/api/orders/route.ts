import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forçar rota dinâmica (não pode ser renderizada estaticamente)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Opcional: validar API_KEY para admin (pode remover se quiser público)
    const authHeader = request.headers.get('X-API-Key')
    const isAdmin = authHeader === process.env.API_KEY

    const orders = await prisma.order.findMany({
      where: {
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
      let totalPrice = order.total_price
      if (typeof totalPrice === 'string') {
        totalPrice = parseFloat(totalPrice)
      } else if (totalPrice && typeof totalPrice === 'object' && 'toNumber' in totalPrice) {
        totalPrice = (totalPrice as any).toNumber()
      } else if (totalPrice === null || totalPrice === undefined) {
        totalPrice = 0
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

    return NextResponse.json(formattedOrders, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos', error: String(error) },
      { status: 500 }
    )
  }
}
