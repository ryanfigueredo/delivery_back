import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth'

/**
 * API para notificar cliente via WhatsApp quando pedido sair para entrega
 * Esta API será chamada pelo app Android após marcar pedido como "out_for_delivery"
 * 
 * A mensagem será enviada via webhook para o bot WhatsApp
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

Seu pedido ${displayId} acabou de sair para entrega e está a caminho!

${order.order_type === 'delivery' && order.delivery_address 
  ? `📍 Endereço: ${order.delivery_address}\n` 
  : ''}Em breve chegará até você!

Obrigado por escolher Pedidos Express! ❤️`

    const mensagemFinal = message || mensagemPadrao

    // Enviar mensagem via API do bot (Railway)
    // O bot tem um servidor Express que recebe comandos de envio
    try {
      // Formatar telefone para WhatsApp
      let whatsappPhone = order.customer_phone.replace(/\D/g, '')
      if (!whatsappPhone.startsWith('55') && whatsappPhone.length === 11) {
        whatsappPhone = `55${whatsappPhone}`
      }
      const formattedPhone = `${whatsappPhone}@s.whatsapp.net`
      
      const botApiUrl = process.env.BOT_API_URL || 'https://web-production-1a0f.up.railway.app/api/bot/send-message'
      
      const botResponse = await fetch(botApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: mensagemFinal
        })
      })

      if (botResponse.ok) {
        console.log(`✅ Mensagem de entrega enviada para ${order.customer_phone}`)
      } else {
        console.warn('Bot API não respondeu, mas pedido foi marcado como saiu')
      }
    } catch (error) {
      console.error('Erro ao chamar bot API:', error)
      // Não falha a operação, apenas loga o erro
      // O bot pode buscar mensagens pendentes via polling também
    }

    // Retornar sucesso
    return NextResponse.json({
      success: true,
      order_id: order.id,
      customer_phone: order.customer_phone,
      display_id: displayId,
      message: mensagemFinal,
      note: 'Mensagem enviada ao bot WhatsApp para notificar cliente'
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao preparar notificação de entrega:', error)
    return NextResponse.json(
      { message: 'Erro ao preparar notificação', error: String(error) },
      { status: 500 }
    )
  }
}
