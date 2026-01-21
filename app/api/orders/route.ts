import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(orders, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar pedidos', error: String(error) },
      { status: 500 }
    )
  }
}
