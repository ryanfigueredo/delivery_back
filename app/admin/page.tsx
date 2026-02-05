'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Tenant {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  _count?: {
    orders: number
    users: number
  }
}

interface BotStatus {
  tenant_id: string
  tenant_name: string
  is_online: boolean
  last_heartbeat?: string
  total_orders_today: number
  total_orders_month: number
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // Carregar tenants
      const tenantsRes = await fetch('/api/admin/tenants')
      const tenantsData = await tenantsRes.json()
      if (tenantsData.success) {
        setTenants(tenantsData.tenants || [])
      }

      // Carregar status dos bots
      const botsRes = await fetch('/api/admin/bot-status')
      const botsData = await botsRes.json()
      if (botsData.success) {
        setBotStatuses(botsData.bots || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">Dashboard Master</h1>
              <p className="text-sm text-gray-500">Visão geral de todos os clientes</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/restaurantes"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Gerenciar Restaurantes
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-gray-900">{tenants.length}</div>
                <div className="text-sm text-gray-500">Total de Clientes</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-primary-600">
                  {botStatuses.filter(b => b.is_online).length}
                </div>
                <div className="text-sm text-gray-500">Bots Online</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">
                  {botStatuses.filter(b => !b.is_online).length}
                </div>
                <div className="text-sm text-gray-500">Bots Offline</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {botStatuses.reduce((sum, b) => sum + b.total_orders_today, 0)}
                </div>
                <div className="text-sm text-gray-500">Pedidos Hoje</div>
              </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">Clientes (Tenants)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenants.map((tenant) => {
                      const botStatus = botStatuses.find(b => b.tenant_id === tenant.id)
                      return (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{tenant.slug}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tenant.is_active 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tenant.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {tenant._count?.orders || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bot Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 font-display">Status dos Bots WhatsApp</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos Hoje</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos Mês</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Atividade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {botStatuses.map((bot) => (
                      <tr key={bot.tenant_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {bot.tenant_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              bot.is_online ? 'bg-primary-500 animate-pulse' : 'bg-red-500'
                            }`}></div>
                            <span className={bot.is_online ? 'text-primary-600 font-semibold' : 'text-red-600'}>
                              {bot.is_online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {bot.total_orders_today}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {bot.total_orders_month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {bot.last_heartbeat 
                            ? new Date(bot.last_heartbeat).toLocaleString('pt-BR')
                            : 'Nunca'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
