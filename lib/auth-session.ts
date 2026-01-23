import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface SessionUser {
  id: string
  username: string
  name: string
  role: string
  tenant_id?: string | null
}

/**
 * Cria uma sessão para o usuário
 */
export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      tenant_id: true,
    },
  })

  if (!user) {
    return null
  }

  // Armazena dados do usuário no cookie
  const cookieStore = await cookies()
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return user as SessionUser
}

/**
 * Obtém o usuário da sessão atual
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return null
    }

    const user = JSON.parse(sessionCookie.value) as SessionUser
    return user
  } catch (error) {
    return null
  }
}

/**
 * Remove a sessão do usuário
 */
export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

/**
 * Verifica credenciais de login
 * Busca o usuário em todos os tenants (ou sem tenant para super admin)
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<SessionUser | null> {
  // Buscar usuário - pode estar em qualquer tenant ou ser super admin (tenant_id = null)
  // Como username não é único sozinho, precisamos buscar com findFirst
  const user = await prisma.user.findFirst({
    where: { username },
  })

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    tenant_id: user.tenant_id,
  }
}

/**
 * Cria hash de senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
