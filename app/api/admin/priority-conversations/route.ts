import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, validateBasicAuth } from '@/lib/auth'
import { getSession } from '@/lib/auth-session'

/**
 * API para listar conversas prioritárias (clientes que pediram atendente)
 * O bot armazena essas conversas e esta API busca do bot
 */
export async function GET(request: NextRequest) {
  // Verificar autenticação: pode ser por sessão (web), API_KEY (app) ou Basic Auth (app mobile)
  const session = await getSession()
  const authValidation = await validateApiKey(request)
  const basicAuth = await validateBasicAuth(request)
  
  // Se não tem sessão, API_KEY válida nem Basic Auth válida, retorna erro
  if (!session && !authValidation.isValid && !basicAuth.isValid) {
    return authValidation.response || NextResponse.json(
      { success: false, error: 'Não autenticado' },
      { status: 401 }
    )
  }

  try {
    // Buscar conversas prioritárias do bot (Railway)
    const botApiUrl = process.env.BOT_API_URL || 'https://web-production-1a0f.up.railway.app/api/bot/priority-conversations'
    
    const botResponse = await fetch(botApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!botResponse.ok) {
      // Se o bot não responder, retorna lista vazia
      return NextResponse.json({ conversations: [] }, { status: 200 })
    }

    const data = await botResponse.json()
    
    // Formatar dados para o app
    const conversations = (data.conversations || []).map((conv: any) => ({
      phone: conv.remetente || conv.phone,
      phoneFormatted: formatPhoneForDisplay(conv.remetente || conv.phone),
      whatsappUrl: `https://wa.me/${formatPhoneForWhatsApp(conv.remetente || conv.phone)}`,
      waitTime: conv.tempoEspera || 0, // minutos
      timestamp: conv.timestamp || Date.now(),
      lastMessage: conv.ultimaMensagem || conv.timestamp || Date.now()
    }))

    return NextResponse.json({ 
      conversations,
      total: conversations.length 
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar conversas prioritárias:', error)
    // Retorna lista vazia em caso de erro
    return NextResponse.json({ conversations: [], total: 0 }, { status: 200 })
  }
}

/**
 * Formata telefone para exibição (ex: (21) 99762-4873)
 */
function formatPhoneForDisplay(phone: string): string {
  // Remove @s.whatsapp.net se tiver
  let clean = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '')
  
  // Remove código do país (55) se tiver
  if (clean.startsWith('55') && clean.length > 11) {
    clean = clean.substring(2)
  }
  
  // Formata: (XX) XXXXX-XXXX
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`
  } else if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`
  }
  
  return clean
}

/**
 * Formata telefone para URL do WhatsApp (ex: 5521997624873)
 */
function formatPhoneForWhatsApp(phone: string): string {
  // Remove @s.whatsapp.net se tiver
  let clean = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '')
  
  // Adiciona código do país se não tiver
  if (!clean.startsWith('55') && clean.length >= 10) {
    clean = `55${clean}`
  }
  
  return clean
}
