import Link from 'next/link'
import { AppIcon } from '@/components/AppIcon'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <AppIcon size={40} className="bg-white rounded-lg p-1" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">Pedidos Express</h1>
                <p className="text-sm text-gray-500">Sistema de Delivery Inteligente</p>
              </div>
            </div>
            <Link
              href="/login"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition shadow-md hover:shadow-lg"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-display">
            Automatize Seu Delivery
            <br />
            <span className="text-primary-600">Com WhatsApp</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Receba pedidos automaticamente via WhatsApp, gerencie seu cardápio e controle tudo em um só lugar.
            Sistema completo para restaurantes e lanchonetes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vendas"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition shadow-lg hover:shadow-xl"
            >
              Ver Planos e Preços
            </Link>
            <Link
              href="/login"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-primary-600 hover:bg-primary-50 transition shadow-lg hover:shadow-xl"
            >
              Acessar Sistema
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">Bot WhatsApp Inteligente</h3>
            <p className="text-gray-600">
              Cliente faz pedido em linguagem natural. O bot entende e processa automaticamente.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">App Mobile Completo</h3>
            <p className="text-gray-600">
              Gerencie pedidos, cardápio e loja direto do celular. Android e iOS.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🖨️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">Impressão Automática</h3>
            <p className="text-gray-600">
              Pedidos imprimem automaticamente quando chegam. Bluetooth ou WiFi.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2 font-display">3x</div>
              <div className="text-gray-600">Mais Pedidos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2 font-display">24/7</div>
              <div className="text-gray-600">Disponível</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2 font-display">100%</div>
              <div className="text-gray-600">Automático</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2 font-display">R$ 0</div>
              <div className="text-gray-600">Setup Inicial</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4 font-display">Pronto para Começar?</h2>
          <p className="text-xl mb-8 opacity-90">
            Automatize seu delivery hoje mesmo e aumente suas vendas.
          </p>
          <Link
            href="/vendas"
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition inline-block shadow-lg"
          >
            Ver Planos e Preços
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Pedidos Express</h3>
              <p className="text-gray-400">
                Sistema completo de automação para delivery via WhatsApp.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/vendas" className="hover:text-white transition">Planos</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/suporte" className="hover:text-white transition">Suporte</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contato</h3>
              <div className="space-y-2 text-gray-400">
                <p>
                  <a 
                    href="https://wa.me/5521997624873" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition underline"
                  >
                    WhatsApp: (21) 99762-4873
                  </a>
                </p>
                <p>
                  Desenvolvido por{' '}
                  <a 
                    href="https://dmtn.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition underline"
                  >
                    dmtn.com.br
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2026 Pedidos Express. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
