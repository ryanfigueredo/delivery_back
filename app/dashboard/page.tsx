'use client'

import useSWR from 'swr'
import { OrderCard } from '@/components/OrderCard'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  total_price: number | string
  status: 'pending' | 'printed' | 'finished'
  created_at: string
  order_number?: number
  daily_sequence?: number
  display_id?: string
  customer_total_orders?: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: orders, error, isLoading, mutate } = useSWR<Order[]>(
    '/api/orders',
    fetcher,
    {
      refreshInterval: 2000, // Atualiza a cada 2 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const handleReprint = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/reprint`, {
        method: 'PATCH',
      })

      if (response.ok) {
        // Atualiza a lista após reimprimir
        mutate()
      } else {
        console.error('Erro ao reimprimir pedido')
      }
    } catch (error) {
      console.error('Erro ao reimprimir pedido:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Pedidos
          </h1>
          <p className="text-gray-600">
            Feed de pedidos em tempo real - Atualização automática a cada 2 segundos
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Erro ao carregar pedidos. Tente novamente.
          </div>
        )}

        {!isLoading && !error && orders && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">
              Nenhum pedido encontrado
            </p>
          </div>
        )}

        {!isLoading && !error && orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReprint={handleReprint}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
