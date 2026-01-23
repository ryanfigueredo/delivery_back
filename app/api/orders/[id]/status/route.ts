import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

/**
 * API para atualizar status do pedido
 * Usado pelo app Android para confirmar impressão
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validação de API_KEY (opcional para impressão)
  const authValidation = await validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  const startTime = Date.now()
  const orderId = params.id

  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { message: 'Status é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      const responseTime = Date.now() - startTime
      console.log(`[UPDATE-STATUS] Pedido não encontrado - ID: ${orderId} - Tempo: ${responseTime}ms`)
      
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    // Atualiza o status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    })

    const responseTime = Date.now() - startTime
    
    console.log(`[UPDATE-STATUS] Pedido atualizado`)
    console.log(`  - ID: ${orderId}`)
    console.log(`  - Status anterior: ${existingOrder.status}`)
    console.log(`  - Status novo: ${updatedOrder.status}`)
    console.log(`  - Tempo: ${responseTime}ms`)

    return NextResponse.json(
      {
        message: 'Status atualizado com sucesso',
        order: updatedOrder,
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error(`[UPDATE-STATUS] Erro - ID: ${orderId} - Tempo: ${responseTime}ms`)
    console.error('Erro:', error)
    
    return NextResponse.json(
      {
        message: 'Erro ao atualizar status',
        error: String(error),
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    )
  }
}
