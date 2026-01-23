'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Verificar se já está logado
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const redirect = searchParams.get('redirect') || '/dashboard'
          router.push(redirect)
        }
      })
      .catch(() => {
        // Não está logado, continuar na página de login
      })
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        const redirect = searchParams.get('redirect') || '/dashboard'
        router.push(redirect)
        router.refresh()
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Usuário
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Digite seu usuário"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Digite sua senha"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-display">
            Pedidos Express
          </h1>
          <p className="text-gray-600">Sistema de Gerenciamento</p>
        </div>

        <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
          <p>
            <a 
              href="https://wa.me/5521997624873" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition underline"
            >
              WhatsApp: (21) 99762-4873
            </a>
          </p>
          <p>
            Sistema desenvolvido por{' '}
            <a 
              href="https://dmtn.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition underline"
            >
              dmtn.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
