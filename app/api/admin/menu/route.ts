import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'

// Cardápio em memória (pode ser migrado para banco depois)
// Estrutura: { id, name, price, category, available }
let MENU_ITEMS = [
  // Hambúrgueres
  { id: 'hamburguer_bovino_simples', name: 'Hambúrguer Bovino Simples', price: 18.00, category: 'hamburguer', available: true },
  { id: 'hamburguer_bovino_duplo', name: 'Hambúrguer Bovino Duplo', price: 28.00, category: 'hamburguer', available: true },
  { id: 'hamburguer_suino_simples', name: 'Hambúrguer Suíno Simples', price: 20.00, category: 'hamburguer', available: true },
  { id: 'hamburguer_suino_duplo', name: 'Hambúrguer Suíno Duplo', price: 30.00, category: 'hamburguer', available: true },
  // Refrigerantes
  { id: 'refrigerante_coca', name: 'Coca-Cola', price: 5.00, category: 'bebida', available: true },
  { id: 'refrigerante_pepsi', name: 'Pepsi', price: 5.00, category: 'bebida', available: true },
  { id: 'refrigerante_guarana', name: 'Guaraná', price: 5.00, category: 'bebida', available: true },
  { id: 'refrigerante_fanta', name: 'Fanta', price: 5.00, category: 'bebida', available: true },
  // Sucos
  { id: 'suco_laranja', name: 'Suco de Laranja', price: 6.00, category: 'bebida', available: true },
  { id: 'suco_maracuja', name: 'Suco de Maracujá', price: 6.00, category: 'bebida', available: true },
  { id: 'suco_limao', name: 'Suco de Limão', price: 6.00, category: 'bebida', available: true },
  { id: 'suco_abacaxi', name: 'Suco de Abacaxi', price: 6.00, category: 'bebida', available: true },
  // Água
  { id: 'agua', name: 'Água', price: 3.00, category: 'bebida', available: true }
]

// GET - Listar cardápio
export async function GET(request: NextRequest) {
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  return NextResponse.json({ items: MENU_ITEMS }, { status: 200 })
}

// PUT - Atualizar item do cardápio
export async function PUT(request: NextRequest) {
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const body = await request.json()
    const { id, name, price, available } = body

    if (!id) {
      return NextResponse.json(
        { message: 'ID do item é obrigatório' },
        { status: 400 }
      )
    }

    const itemIndex = MENU_ITEMS.findIndex(item => item.id === id)
    if (itemIndex === -1) {
      return NextResponse.json(
        { message: 'Item não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar item
    if (name !== undefined) MENU_ITEMS[itemIndex].name = name
    if (price !== undefined) MENU_ITEMS[itemIndex].price = price
    if (available !== undefined) MENU_ITEMS[itemIndex].available = available

    return NextResponse.json({
      success: true,
      item: MENU_ITEMS[itemIndex]
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar cardápio:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar cardápio', error: String(error) },
      { status: 500 }
    )
  }
}

// POST - Adicionar novo item
export async function POST(request: NextRequest) {
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const body = await request.json()
    const { id, name, price, category, available } = body

    if (!id || !name || price === undefined || !category) {
      return NextResponse.json(
        { message: 'Campos obrigatórios: id, name, price, category' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    if (MENU_ITEMS.find(item => item.id === id)) {
      return NextResponse.json(
        { message: 'Item com este ID já existe' },
        { status: 400 }
      )
    }

    const newItem = {
      id,
      name,
      price: Number(price),
      category,
      available: available !== undefined ? available : true
    }

    MENU_ITEMS.push(newItem)

    return NextResponse.json({
      success: true,
      item: newItem
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar item ao cardápio:', error)
    return NextResponse.json(
      { message: 'Erro ao adicionar item', error: String(error) },
      { status: 500 }
    )
  }
}
