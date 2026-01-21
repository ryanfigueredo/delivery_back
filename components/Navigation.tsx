'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  name: string
  role: string
}

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Não mostrar navegação na página de login e suporte
  if (pathname === '/login' || pathname === '/suporte' || loading) {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/atendimento', label: 'Atendimento', icon: '💬' },
  ]

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                Tamboril Burguer
              </h1>
            </div>
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
