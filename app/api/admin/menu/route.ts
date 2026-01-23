import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'

// Cardápio em memória (pode ser migrado para banco depois)
// Estrutura: { id, name, price, category, available, order }
let MENU_ITEMS = [
  // Hambúrgueres
  { id: 'hamburguer_bovino_simples', name: 'Hambúrguer Bovino Simples', price: 18.00, category: 'hamburguer', available: true, order: 1 },
  { id: 'hamburguer_bovino_duplo', name: 'Hambúrguer Bovino Duplo', price: 28.00, category: 'hamburguer', available: true, order: 2 },
  { id: 'hamburguer_suino_simples', name: 'Hambúrguer Suíno Simples', price: 20.00, category: 'hamburguer', available: true, order: 3 },
  { id: 'hamburguer_suino_duplo', name: 'Hambúrguer Suíno Duplo', price: 30.00, category: 'hamburguer', available: true, order: 4 },
  // Refrigerantes
  { id: 'refrigerante_coca', name: 'Coca-Cola', price: 5.00, category: 'bebida', available: true, order: 1 },
  { id: 'refrigerante_pepsi', name: 'Pepsi', price: 5.00, category: 'bebida', available: true, order: 2 },
  { id: 'refrigerante_guarana', name: 'Guaraná', price: 5.00, category: 'bebida', available: true, order: 3 },
  { id: 'refrigerante_fanta', name: 'Fanta', price: 5.00, category: 'bebida', available: true, order: 4 },
  // Sucos
  { id: 'suco_laranja', name: 'Suco de Laranja', price: 6.00, category: 'bebida', available: true, order: 5 },
  { id: 'suco_maracuja', name: 'Suco de Maracujá', price: 6.00, category: 'bebida', available: true, order: 6 },
  { id: 'suco_limao', name: 'Suco de Limão', price: 6.00, category: 'bebida', available: true, order: 7 },
  { id: 'suco_abacaxi', name: 'Suco de Abacaxi', price: 6.00, category: 'bebida', available: true, order: 8 },
  // Água
  { id: 'agua', name: 'Água', price: 3.00, category: 'bebida', available: true, order: 9 }
]

// GET - Listar cardápio
export async function GET(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import('@/lib/auth-session').then(m => m.getSession())
  const authValidation = await validateApiKey(request)
  
  if (!session && !authValidation.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  // Ordenar por categoria e order
  const sortedItems = MENU_ITEMS.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return (a.order || 0) - (b.order || 0)
  })

  return NextResponse.json({ items: sortedItems }, { status: 200 })
}

// PUT - Atualizar item do cardápio
export async function PUT(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import('@/lib/auth-session').then(m => m.getSession())
  const authValidation = await validateApiKey(request)
  
  if (!session && !authValidation.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
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
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import('@/lib/auth-session').then(m => m.getSession())
  const authValidation = await validateApiKey(request)
  
  if (!session && !authValidation.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
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

    // Calcular order (último item da categoria + 1)
    const categoryItems = MENU_ITEMS.filter(item => item.category === category)
    const maxOrder = categoryItems.length > 0 
      ? Math.max(...categoryItems.map(item => item.order || 0))
      : 0

    const newItem = {
      id,
      name,
      price: Number(price),
      category,
      available: available !== undefined ? available : true,
      order: maxOrder + 1
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

// DELETE - Deletar item do cardápio
export async function DELETE(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import('@/lib/auth-session').then(m => m.getSession())
  const authValidation = await validateApiKey(request)
  
  if (!session && !authValidation.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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

    MENU_ITEMS.splice(itemIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Item deletado com sucesso'
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return NextResponse.json(
      { message: 'Erro ao deletar item', error: String(error) },
      { status: 500 }
    )
  }
}

// PATCH - Reordenar itens
export async function PATCH(request: NextRequest) {
  // Permitir acesso via sessão (web) ou API key (app)
  const session = await import('@/lib/auth-session').then(m => m.getSession())
  const authValidation = await validateApiKey(request)
  
  if (!session && !authValidation.isValid) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { items } = body // Array de { id, order }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { message: 'items deve ser um array' },
        { status: 400 }
      )
    }

    // Atualizar order de cada item
    items.forEach(({ id, order }: { id: string, order: number }) => {
      const item = MENU_ITEMS.find(item => item.id === id)
      if (item) {
        item.order = order
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Itens reordenados com sucesso'
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao reordenar itens:', error)
    return NextResponse.json(
      { message: 'Erro ao reordenar itens', error: String(error) },
      { status: 500 }
    )
  }
}
