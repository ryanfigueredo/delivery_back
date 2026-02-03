"use client";

import Link from "next/link";
import { AppIcon } from "@/components/AppIcon";
import {
  Bot,
  Smartphone,
  Printer,
  Play,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/** Ícone WhatsApp (só para o badge "Pedidos pelo WhatsApp"). */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
      <path
        fill="#fff"
        d="M7.772 6.285c-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header – estilo delivery */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <AppIcon size={36} />
              <span className="text-xl font-bold text-gray-900 font-display">
                Pedidos Express
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/vendas"
                className="hidden sm:inline-flex text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Planos
              </Link>
              <Link
                href="/login"
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero – foco restaurante, chamativo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
              <WhatsAppIcon size={18} />
              Pedidos pelo WhatsApp
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 font-display leading-tight mb-6">
              Seu restaurante{" "}
              <span className="text-amber-600">vendendo mais</span>
              <br />
              sem fila de telefone
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl">
              Cliente pede pelo WhatsApp. O bot anota, você recebe no app e na
              impressora. Lanchonete, hamburgueria ou pizzaria — tudo no mesmo
              lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/vendas"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Quero vender mais
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white text-gray-800 px-8 py-4 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Já tenho conta
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-6 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500 flex-shrink-0"
                />
                Sem taxa de adesão
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500 flex-shrink-0"
                />
                App para gestão
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className="text-emerald-500 flex-shrink-0"
                />
                Impressão automática
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Para seu restaurante – 3 pilares */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display text-center mb-4">
            Feito para seu negócio
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-14">
            Do pedido no WhatsApp até a impressão na cozinha — tudo
            automatizado.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-amber-100 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 text-amber-600">
                <Bot size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">
                Bot no WhatsApp
              </h3>
              <p className="text-gray-600">
                Cliente manda o pedido em texto. O bot entende, confirma e envia
                direto para sua cozinha. Sem atendente 24h.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-amber-100 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">
                App no celular
              </h3>
              <p className="text-gray-600">
                Veja pedidos, altere cardápio e abra/feche a loja pelo app.
                Android e iOS, sempre sincronizado.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-amber-100 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                <Printer size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">
                Impressão na cozinha
              </h3>
              <p className="text-gray-600">
                Pedido chega e imprime sozinho. Bobina 58mm via Bluetooth ou
                WiFi. Zero digitação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona – 3 passos */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display text-center mb-4">
            Como funciona
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-14">
            Em 3 passos seu restaurante começa a receber pedidos pelo WhatsApp.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Cliente pede no WhatsApp
              </h3>
              <p className="text-gray-600 text-sm">
                Seu cliente manda o pedido em texto. O bot confirma itens e
                valor.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Você recebe no app
              </h3>
              <p className="text-gray-600 text-sm">
                O pedido aparece no seu celular e no painel web. Você acompanha
                tudo em tempo real.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Imprime na cozinha
              </h3>
              <p className="text-gray-600 text-sm">
                A comanda sai na impressora térmica. Cozinha prepara e você
                entrega ou retira.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vídeos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display text-center mb-4">
            Veja na prática
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Assista ao sistema em ação: pedidos pelo WhatsApp, app e impressão.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
              <div className="text-center p-8">
                <Play size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600">Vídeo 1</p>
                <p className="text-xs text-gray-500 mt-1">
                  Bot WhatsApp / Pedidos
                </p>
              </div>
            </div>
            <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
              <div className="text-center p-8">
                <Play size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600">Vídeo 2</p>
                <p className="text-xs text-gray-500 mt-1">App Mobile</p>
              </div>
            </div>
            <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center md:col-span-2 lg:col-span-1">
              <div className="text-center p-8">
                <Play size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600">Vídeo 3</p>
                <p className="text-xs text-gray-500 mt-1">Impressão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-amber-500 font-display mb-1">
                3x
              </div>
              <div className="text-gray-600 text-sm">mais pedidos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 font-display mb-1">
                24/7
              </div>
              <div className="text-gray-600 text-sm">disponível</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 font-display mb-1">
                100%
              </div>
              <div className="text-gray-600 text-sm">automático</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-500 font-display mb-1">
                R$ 0
              </div>
              <div className="text-gray-600 text-sm">adesão</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-gradient-to-br from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
            Pronto para receber pedidos pelo WhatsApp?
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Comece hoje. Sem taxa de adesão. Configure em minutos.
          </p>
          <Link
            href="/vendas"
            className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-amber-50 transition-all"
          >
            Ver planos e preços
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <AppIcon size={32} />
                <span className="text-xl font-bold font-display">
                  Pedidos Express
                </span>
              </div>
              <p className="text-gray-400 max-w-sm">
                Sistema de pedidos e delivery via WhatsApp para restaurantes,
                lanchonetes e hamburgerias.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/vendas" className="hover:text-white transition">
                    Planos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/suporte" className="hover:text-white transition">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contato</h3>
              <div className="space-y-3 text-gray-400">
                <p>
                  <a
                    href="https://wa.me/5521997624873"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    WhatsApp (21) 99762-4873
                  </a>
                </p>
                <p>
                  <a
                    href="https://dmtn.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    dmtn.com.br
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; 2026 Pedidos Express. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
