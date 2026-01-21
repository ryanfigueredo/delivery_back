import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { getStoreStatus, updateStoreStatus } from '@/lib/store-status'

// GET - Obter status atual da loja
export async function GET(request: NextRequest) {
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  const status = getStoreStatus()
  return NextResponse.json(status, { status: 200 })
}

// POST - Atualizar status da loja (abrir/fechar)
export async function POST(request: NextRequest) {
  const authValidation = validateApiKey(request)
  if (!authValidation.isValid) {
    return authValidation.response!
  }

  try {
    const body = await request.json()
    const { isOpen, nextOpenTime, message } = body

    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { message: 'isOpen deve ser um boolean' },
        { status: 400 }
      )
    }

    // Atualizar status
    const updatedStatus = updateStoreStatus({ isOpen, nextOpenTime, message })

    return NextResponse.json({
      success: true,
      status: updatedStatus
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar status da loja:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar status', error: String(error) },
      { status: 500 }
    )
  }
}
