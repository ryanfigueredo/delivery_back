import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

/**
 * API para notificar cliente via WhatsApp quando pedido sair para entrega
 * Esta API será chamada pelo app Android após marcar pedido como "out_for_delivery"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validação de API_KEY
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const orderId = params.id
    const body = await request.json()
    const { message } = body // Mensagem customizada (opcional)

    // Buscar pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { message: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (order.status !== 'out_for_delivery') {
      return NextResponse.json(
        { message: 'Pedido não está marcado como "saiu para entrega"' },
        { status: 400 }
      )
    }

    // Preparar mensagem para o cliente
    const displayId = order.display_id || `#${order.daily_sequence?.toString().padStart(3, '0') || '000'}`
    const mensagemPadrao = `🚚 *PEDIDO ${displayId} SAIU PARA ENTREGA!*

Olá ${order.customer_name}! 👋

Seu pedido ${displayId} acabou de sair para entrega e está a caminho! 🍔

${order.order_type === 'delivery' && order.delivery_address 
  ? `📍 Endereço: ${order.delivery_address}\n` 
  : ''}Em breve chegará até você!

Obrigado por escolher Tamboril Burguer! 🍔❤️`

    const mensagemFinal = message || mensagemPadrao

    // Retornar dados para o app Android enviar via WhatsApp
    // O app Android terá acesso ao Baileys para enviar a mensagem
    return NextResponse.json({
      success: true,
      order_id: order.id,
      customer_phone: order.customer_phone,
      display_id: displayId,
      message: mensagemFinal,
      // Formato do telefone para WhatsApp (adicionar código do país se necessário)
      whatsapp_phone: `55${order.customer_phone}@s.whatsapp.net`
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao preparar notificação de entrega:', error)
    return NextResponse.json(
      { message: 'Erro ao preparar notificação', error: String(error) },
      { status: 500 }
    )
  }
}
