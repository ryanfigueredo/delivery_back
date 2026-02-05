import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import { Check } from "lucide-react";
import { DeliveryAnimation } from "@/components/DeliveryAnimation";

export default function VendasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <AppIcon size={40} className="bg-white rounded-lg p-1" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedidos Express
                </h1>
                <p className="text-sm text-gray-500">
                  Sistema de Delivery Inteligente
                </p>
              </div>
            </Link>
            <Link
              href="/login"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="text-center md:text-left flex-1">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 font-display">
              Planos e Preços
            </h1>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          <div className="flex-shrink-0 w-full md:w-96 max-w-md">
            <DeliveryAnimation className="w-full h-auto" />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Plano Básico */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                R$ 297<span className="text-lg text-gray-500">/mês</span>
              </div>
              <p className="text-gray-600">Ideal para começar</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Bot WhatsApp</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>1.000 mensagens/mês</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>App Mobile (Android + iOS)</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Dashboard Web</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Suporte por email</span>
              </li>
            </ul>
            <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              Contatar Vendas
            </button>
          </div>

          {/* Plano Completo - Destaque */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-2xl p-8 border-4 border-primary-500 transform scale-105 relative">
            <div className="absolute top-0 right-0 bg-accent-400 text-accent-900 px-4 py-1 rounded-bl-lg rounded-tr-2xl font-bold text-sm">
              MAIS POPULAR
            </div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2 font-display">
                Completo
              </h3>
              <div className="text-4xl font-bold text-white mb-2 font-display">
                R$ 497<span className="text-lg text-primary-100">/mês</span>
              </div>
              <p className="text-primary-100">Recomendado</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">Tudo do Básico</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">5.000 mensagens/mês</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">500 notas fiscais/mês</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">Impressão Bluetooth</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">Suporte prioritário</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">Atualizações automáticas</span>
              </li>
              <li className="flex items-start">
                <Check size={18} className="text-white mr-2 flex-shrink-0" />
                <span className="text-white">Backup automático</span>
              </li>
            </ul>
            <button className="w-full bg-white text-primary-600 py-3 rounded-lg font-semibold hover:bg-primary-50 transition shadow-lg">
              Contatar Vendas
            </button>
          </div>

          {/* Plano Premium */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
              <div className="text-4xl font-bold text-gray-900 mb-2">
                R$ 797<span className="text-lg text-gray-500">/mês</span>
              </div>
              <p className="text-gray-600">Para grandes operações</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Tudo do Completo</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Múltiplas lojas</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Relatórios avançados</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Suporte 24/7</span>
              </li>
              <li className="flex items-start">
                <Check
                  size={18}
                  className="text-primary-500 mr-2 flex-shrink-0"
                />
                <span>Consultoria incluída</span>
              </li>
            </ul>
            <button className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              Contatar Vendas
            </button>
          </div>
        </div>

        {/* Emissão de NFE */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-primary-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center font-display">
            Emissão de Nota Fiscal (NF-e)
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-2xl mx-auto">
            O plano Completo inclui <strong>500 notas fiscais por mês</strong>. 
            Se você precisar emitir mais notas fiscais, o valor adicional será cobrado 
            proporcionalmente.
          </p>
          <div className="bg-primary-50 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-lg text-gray-900 mb-2">
                <strong>Valor adicional:</strong>
              </p>
              <p className="text-2xl font-bold text-primary-600 font-display">
                R$ 0,50 por nota fiscal adicional
              </p>
              <p className="text-sm text-gray-700 mt-3">
                Exemplo: Se emitir 750 notas fiscais no mês, serão cobradas 
                <strong className="text-gray-900"> 250 notas adicionais × R$ 0,50 = R$ 125,00</strong> além da mensalidade.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-6">
            Valores baseados em custos reais de emissão. Entre em contato para mais informações.
          </p>
        </div>

        {/* Implementação */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Implementação
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                O que está incluído:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 flex-shrink-0"
                  />
                  <span>Configuração completa do bot</span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 flex-shrink-0"
                  />
                  <span>Personalização com nome/logo</span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 flex-shrink-0"
                  />
                  <span>Integração com sistema</span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 flex-shrink-0"
                  />
                  <span>Treinamento da equipe (2h)</span>
                </li>
                <li className="flex items-start">
                  <Check
                    size={18}
                    className="text-primary-500 mr-2 flex-shrink-0"
                  />
                  <span>Deploy e configuração</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Valor:</h3>
              <div className="bg-primary-50 rounded-lg p-6 mb-4">
                <div className="text-3xl font-bold text-primary-600 mb-2 font-display">
                  R$ 2.500
                </div>
                <p className="text-gray-900">Pagamento único</p>
              </div>
              <p className="text-gray-700">
                Inclui tudo que você precisa para começar. Sem surpresas.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/login"
            className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 transition inline-block shadow-lg"
          >
            Começar Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4b5563] text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-2 mb-4">
            <p className="text-gray-400">
              <a
                href="https://wa.me/5521997624873"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition underline"
              >
                WhatsApp: (21) 99762-4873
              </a>
            </p>
          </div>
          <p className="text-gray-400">
            &copy; 2026 Pedidos Express. Desenvolvido por{" "}
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
      </footer>
    </div>
  );
}
