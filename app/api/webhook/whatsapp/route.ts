import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WhatsAppWebhookPayload, OrderItem } from '@/types/order'
import { Prisma } from '@prisma/client'

/**
 * Sanitiza e valida dados do JSONB para prevenir injeções
 * Remove caracteres perigosos e valida estrutura
 */
function sanitizeJsonbData(items: any[]): OrderItem[] {
  return items.map((item: any) => {
    // Sanitizar strings removendo caracteres perigosos
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return ''
      // Remove caracteres de controle e caracteres perigosos para SQL/JSON
      return str
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .replace(/[<>\"'\\]/g, '') // Remove caracteres potencialmente perigosos
        .trim()
        .substring(0, 500) // Limita tamanho máximo
    }

    return {
      id: sanitizeString(String(item.id || '')),
      name: sanitizeString(String(item.name || '')),
      quantity: Math.max(0, Math.min(1000, Math.floor(Number(item.quantity) || 0))), // Limita entre 0 e 1000
      price: Math.max(0, Math.min(999999.99, Number(item.price) || 0)) // Limita preço máximo
    }
  })
}

function validateOrderData(data: any): { isValid: boolean; errors: string[]; sanitizedData?: WhatsAppWebhookPayload } {
  const errors: string[] = []

  if (!data) {
    errors.push('Dados do pedido não fornecidos')
    return { isValid: false, errors }
  }

  // Validar customer_name
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim().length === 0) {
    errors.push('Nome do cliente é obrigatório')
  }

  // Validar customer_phone
  if (!data.customer_phone || typeof data.customer_phone !== 'string' || data.customer_phone.trim().length === 0) {
    errors.push('Telefone do cliente é obrigatório')
  }

  // Validar items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Items do pedido são obrigatórios e devem ser um array não vazio')
  } else {
    // Validar estrutura de cada item
    data.items.forEach((item: any, index: number) => {
      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Item ${index + 1}: ID é obrigatório`)
      }
      if (!item.name || typeof item.name !== 'string') {
        errors.push(`Item ${index + 1}: Nome é obrigatório`)
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantidade deve ser um número maior que zero`)
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        errors.push(`Item ${index + 1}: Preço deve ser um número maior ou igual a zero`)
      }
    })
  }

  // Validar total_price
  if (typeof data.total_price !== 'number' || data.total_price < 0) {
    errors.push('Preço total deve ser um número maior ou igual a zero')
  }

  // Validar se o total_price corresponde à soma dos items
  if (Array.isArray(data.items) && data.items.length > 0) {
    const calculatedTotal = data.items.reduce((sum: number, item: OrderItem) => {
      return sum + item.price * item.quantity
    }, 0)
    const tolerance = 0.01 // Tolerância para diferenças de arredondamento
    if (Math.abs(calculatedTotal - data.total_price) > tolerance) {
      errors.push(`Preço total (${data.total_price}) não corresponde à soma dos items (${calculatedTotal.toFixed(2)})`)
    }
  }

  // Se passou na validação, sanitizar os dados
  if (errors.length === 0) {
    const sanitizedItems = sanitizeJsonbData(data.items)
    const sanitizedData: WhatsAppWebhookPayload = {
      customer_name: data.customer_name.trim().substring(0, 200),
      customer_phone: data.customer_phone.trim().substring(0, 20),
      items: sanitizedItems,
      total_price: Math.max(0, Math.min(999999.99, data.total_price))
    }
    return {
      isValid: true,
      errors: [],
      sanitizedData
    }
  }

  return {
    isValid: false,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse do body
    const body = await request.json()

    // Validação e sanitização dos dados
    const validation = validateOrderData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Usar dados sanitizados para prevenir injeções
    const orderData = validation.sanitizedData!

    // Obter método de pagamento se existir
    const paymentMethod = body.payment_method || 'Não especificado'
    
    // Obter tipo de pedido (restaurante ou delivery)
    const orderType = body.order_type || 'restaurante'
    
    // Obter endereço de entrega (apenas para delivery)
    const deliveryAddress = body.delivery_address || null

    // Normalizar telefone (remover caracteres especiais e garantir formato correto)
    let normalizedPhone = orderData.customer_phone.replace(/\D/g, '')
    // Se começar com 55 (código do país) e tiver mais de 11 dígitos, remover o 55
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2)
    }
    // Garantir que não tenha caracteres estranhos
    normalizedPhone = normalizedPhone.replace(/[^0-9]/g, '')

    // Contar quantos pedidos já existem deste telefone (correspondência exata)
    const ordersFromPhone = await prisma.order.count({
      where: {
        customer_phone: normalizedPhone
      }
    })

    // Calcular número do pedido (sequencial por telefone)
    const orderNumber = ordersFromPhone + 1

    // Total de pedidos do cliente (para promoções do Papelão)
    const customerTotalOrders = ordersFromPhone + 1

    // Calcular sequência diária (quantos pedidos foram feitos hoje)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dailySequence = await prisma.order.count({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow
        }
      }
    }) + 1

    // Gerar display_id no formato #001, #002, #003 (sequência diária com zeros à esquerda)
    const displayId = `#${String(dailySequence).padStart(3, '0')}`

    // Calcular tempo estimado baseado na fila (20 minutos por pedido)
    // Se for o 1º pedido = 20 min, 2º = 40 min, 3º = 60 min, etc.
    const estimatedTime = dailySequence * 20

    // Criar pedido no banco de dados usando dados sanitizados
    // O Prisma já protege contra SQL injection, mas garantimos que o JSONB está limpo
    const order = await prisma.order.create({
      data: {
        customer_name: orderData.customer_name,
        customer_phone: normalizedPhone,
        items: orderData.items as unknown as Prisma.InputJsonValue, // JSONB sanitizado
        total_price: new Prisma.Decimal(orderData.total_price),
        status: 'pending',
        payment_method: paymentMethod,
        order_number: orderNumber,
        daily_sequence: dailySequence,
        display_id: displayId,
        customer_total_orders: customerTotalOrders,
        order_type: orderType,
        estimated_time: estimatedTime,
        delivery_address: deliveryAddress
      }
    })

    // Retornar sucesso com o ID do pedido
    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        display_id: order.display_id,
        daily_sequence: order.daily_sequence,
        customer_total_orders: order.customer_total_orders,
        estimated_time: order.estimated_time,
        order_type: order.order_type,
        message: 'Pedido criado com sucesso'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error)

    // Tratamento de erros específicos do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: 'Erro de duplicação no banco de dados',
            details: 'Já existe um registro com esses dados'
          },
          { status: 409 }
        )
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          {
            success: false,
            error: 'Erro de referência no banco de dados',
            details: 'Referência inválida'
          },
          { status: 400 }
        )
      }
    }

    // Erro genérico
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? String(error) : 'Erro ao processar pedido'
      },
      { status: 500 }
    )
  }
}

// Método GET para verificação de saúde do endpoint
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Webhook WhatsApp endpoint está ativo',
      method: 'POST',
      description: 'Este endpoint recebe pedidos do bot do WhatsApp'
    },
    { status: 200 }
  )
}
