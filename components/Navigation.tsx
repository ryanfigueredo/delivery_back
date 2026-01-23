'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardIcon, MenuIcon, StoreIcon, MessageIcon, CrownIcon, BuildingIcon, LogoutIcon, UserIcon } from './Icons'
import { AppIcon } from './AppIcon'

interface User {
  id: string
  username: string
  name: string
  role: string
  tenant_id?: string | null
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

  // Não mostrar navegação na página de login, suporte, home e vendas
  if (pathname === '/login' || pathname === '/suporte' || pathname === '/' || pathname === '/vendas' || loading) {
    return null
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/cardapio', label: 'Cardápio', icon: MenuIcon },
    { href: '/loja', label: 'Controle de Loja', icon: StoreIcon },
    { href: '/atendimento', label: 'Atendimento', icon: MessageIcon },
  ]

  // Adicionar links Admin se for super admin (sem tenant_id)
  if (user && !user.tenant_id) {
    navItems.push({ href: '/admin', label: 'Master', icon: CrownIcon })
    navItems.push({ href: '/admin/restaurantes', label: 'Restaurantes', icon: BuildingIcon })
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <AppIcon size={32} />
              <h1 className="text-xl font-bold text-gray-900 font-display">
                Pedidos Express
              </h1>
            </div>
            
            {/* Navigation Items */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const IconComponent = item.icon
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent 
                      size={18} 
                      className={isActive ? 'text-primary-600' : 'text-gray-500'} 
                    />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <UserIcon size={16} className="text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-500 capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogoutIcon size={16} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const IconComponent = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-all min-w-[70px] ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent 
                    size={20} 
                    className={isActive ? 'text-primary-600' : 'text-gray-500'} 
                  />
                  <span className="text-center">{item.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
