import { NextRequest, NextResponse } from 'next/server'
import { getTenantByApiKey } from '@/lib/tenant'
import { getMenuItems } from '@/lib/menu-data'

/**
 * API pública de cardápio para o bot WhatsApp.
 * Aceita X-API-Key ou api_key (query) e retorna itens do menu do tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
      || request.nextUrl.searchParams.get('api_key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key obrigatória. Use X-API-Key ou api_key.' },
        { status: 401 }
      )
    }

    const tenant = await getTenantByApiKey(apiKey)
    if (!tenant) {
      return NextResponse.json(
        { error: 'API key inválida ou tenant inativo.' },
        { status: 401 }
      )
    }

    const items = getMenuItems(tenant.id)
    return NextResponse.json({ items, tenant_id: tenant.id, tenant_slug: tenant.slug }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar menu público:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cardápio' },
      { status: 500 }
    )
  }
}
