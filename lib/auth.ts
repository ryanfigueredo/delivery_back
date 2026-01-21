import { NextRequest, NextResponse } from 'next/server'

/**
 * Valida se a requisição contém a API_KEY válida no header
 * @param request - Requisição HTTP do Next.js
 * @returns Objeto com isValid e response (se inválido)
 */
export function validateApiKey(request: NextRequest): { isValid: boolean; response?: NextResponse } {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
  
  // API_KEY fixa configurada via variável de ambiente
  const validApiKey = process.env.API_KEY || 'tamboril-burguer-api-key-2024-secure'
  
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
  
  // Comparação segura usando timing-safe comparison para evitar timing attacks
  if (!timingSafeEqual(apiKey, validApiKey)) {
    return {
      isValid: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'API_KEY inválida'
        },
        { status: 401 }
      )
    }
  }
  
  return { isValid: true }
}

/**
 * Comparação segura contra timing attacks
 * Compara duas strings de forma constante no tempo
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}
