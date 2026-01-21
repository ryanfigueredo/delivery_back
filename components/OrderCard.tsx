'use client'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  total_price: number | string
  status: 'pending' | 'printed' | 'finished'
  created_at: string
  order_number?: number
  daily_sequence?: number
  display_id?: string
  customer_total_orders?: number
}

interface OrderCardProps {
  order: Order
  onReprint: (orderId: string) => void
}

export function OrderCard({ order, onReprint }: OrderCardProps) {
  const isPending = order.status === 'pending'
  const isPrinted = order.status === 'printed'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numPrice)
  }

  return (
    <div
      className={`rounded-lg shadow-md p-6 transition-all duration-200 ${
        isPending
          ? 'bg-yellow-50 border-2 border-yellow-400'
          : isPrinted
          ? 'bg-green-50 border-2 border-green-400'
          : 'bg-white border-2 border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">
              {order.display_id || `Pedido #${order.daily_sequence || order.id.slice(0, 8)}`}
            </h2>
            {order.daily_sequence && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                {order.daily_sequence}º do dia
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                isPending
                  ? 'bg-yellow-400 text-yellow-900'
                  : isPrinted
                  ? 'bg-green-400 text-green-900'
                  : 'bg-gray-400 text-gray-900'
              }`}
            >
              {isPending ? 'Pendente' : isPrinted ? 'Impresso' : 'Finalizado'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {formatDate(order.created_at)}
          </p>
        </div>
        {isPrinted && (
          <button
            onClick={() => onReprint(order.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            Reimprimir
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Cliente:
        </h3>
        <p className="text-gray-900 font-medium">{order.customer_name}</p>
        <p className="text-sm text-gray-600">{order.customer_phone}</p>
        {order.customer_total_orders && order.customer_total_orders > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            🎉 {order.customer_total_orders}º pedido deste cliente
          </p>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Itens do Pedido:
        </h3>
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div
              key={item.id || index}
              className="flex justify-between items-center bg-white rounded p-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">
                  {item.quantity}x
                </span>
                <span className="text-gray-900">{item.name}</span>
              </div>
              <span className="text-gray-700 font-semibold">
                {formatPrice(item.price)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Total:
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(order.total_price)}
          </span>
        </div>
      </div>
    </div>
  )
}
