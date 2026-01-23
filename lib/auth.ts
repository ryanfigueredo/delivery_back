import { NextRequest, NextResponse } from 'next/server'
import { getTenantByApiKey, TenantInfo } from './tenant'

/**
 * Valida se a requisição contém a API_KEY válida no header e retorna o tenant
 * @param request - Requisição HTTP do Next.js
 * @returns Objeto com isValid, tenant (se válido) e response (se inválido)
 */
export async function validateApiKey(request: NextRequest): Promise<{ 
  isValid: boolean
  tenant?: TenantInfo
  response?: NextResponse 
}> {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
  
  if (!apiKey) {
    return {
      isValid: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'API_KEY não fornecida no header. Use o header X-API-Key.'
        },
        { status: 401 }
      )
    }
  }
  
  // Buscar tenant pelo API key
  const tenant = await getTenantByApiKey(apiKey)
  
  if (!tenant) {
    return {
      isValid: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'API_KEY inválida ou tenant inativo'
        },
        { status: 401 }
      )
    }
  }
  
  return { isValid: true, tenant }
}
