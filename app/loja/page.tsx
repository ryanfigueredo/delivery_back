'use client'

import { useState, useEffect } from 'react'

interface StoreStatus {
  isOpen: boolean
  nextOpenTime: string | null
  message: string | null
  lastUpdated: string
}

export default function LojaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<StoreStatus>({
    isOpen: true,
    nextOpenTime: null,
    message: null,
    lastUpdated: new Date().toISOString(),
  })
  const [nextOpenTime, setNextOpenTime] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    loadStoreStatus()
  }, [])

  const loadStoreStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/store-hours')
      const data = await res.json()
      const storeStatus = data.status || data
      if (storeStatus) {
        setStatus({
          isOpen: storeStatus.isOpen ?? true,
          nextOpenTime: storeStatus.nextOpenTime || null,
          message: storeStatus.message || null,
          lastUpdated: storeStatus.lastUpdated || new Date().toISOString(),
        })
        setNextOpenTime(storeStatus.nextOpenTime || '')
        setCustomMessage(storeStatus.message || '')
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/store-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: status.isOpen,
          nextOpenTime: status.isOpen ? null : nextOpenTime || null,
          message: customMessage || null,
        }),
      })

      const data = await res.json()
      if (data.success || data.status) {
        alert('✅ Status atualizado com sucesso!')
        loadStoreStatus()
      } else {
        alert(`❌ Erro: ${data.error || data.message || 'Erro ao salvar'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar status:', error)
      alert('❌ Erro ao salvar status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-gray-900 font-display mb-2">Controle de Loja</h1>
          <p className="text-gray-600 text-lg">Gerencie o status e horários da sua loja</p>
        </div>

        {/* Status da Loja */}
        <div className="card-modern p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-display mb-2">Status da Loja</h2>
              <p className="text-sm text-gray-500">
                Última atualização: {new Date(status.lastUpdated).toLocaleString('pt-BR')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status.isOpen}
                onChange={(e) => setStatus({ ...status, isOpen: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-primary-600"></div>
              <span className={`ml-3 text-lg font-bold ${status.isOpen ? 'text-primary-600' : 'text-red-600'}`}>
                {status.isOpen ? '🟢 ABERTA' : '🔴 FECHADA'}
              </span>
            </label>
          </div>

          {!status.isOpen && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={nextOpenTime}
                onChange={(e) => setNextOpenTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Defina quando a loja voltará a abrir
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem Customizada (opcional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Voltamos às 18h! Ou: Fechado para manutenção."
            />
            <p className="text-xs text-gray-500 mt-1">
              Esta mensagem será exibida para clientes quando a loja estiver fechada
            </p>
          </div>
        </div>

        {/* Preview da Mensagem */}
        {!status.isOpen && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm animate-fade-in">
            <h3 className="text-lg font-bold text-blue-900 mb-3 font-display">Preview da Mensagem</h3>
            <div className="bg-white p-4 rounded border border-blue-200">
              <p className="text-gray-900 font-semibold mb-2">
                {status.isOpen ? '🟢 Loja Aberta' : '🔴 Loja Fechada'}
              </p>
              {nextOpenTime && (
                <p className="text-gray-700 mb-2">
                  ⏰ Horário de abertura: {nextOpenTime}
                </p>
              )}
              {customMessage && (
                <p className="text-gray-700">
                  {customMessage}
                </p>
              )}
              {!nextOpenTime && !customMessage && (
                <p className="text-gray-500 italic">
                  Nenhuma mensagem configurada
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Status'}
          </button>
          <button
            onClick={loadStoreStatus}
            className="btn-secondary"
          >
            Atualizar
          </button>
        </div>

        {/* Informações */}
        <div className="mt-8 bg-gradient-to-r from-accent-50 to-accent-100 border border-accent-200 rounded-xl p-4 shadow-sm animate-fade-in">
          <p className="text-sm text-yellow-800">
            <strong>💡 Dica:</strong> Quando a loja estiver fechada, o bot do WhatsApp informará automaticamente 
            aos clientes que a loja está fechada e mostrará a mensagem configurada acima.
          </p>
        </div>
      </div>
    </div>
  )
}
