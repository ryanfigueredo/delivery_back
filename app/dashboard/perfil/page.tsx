"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Save, Loader2, AlertCircle, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";

interface CustomerData {
  customer_cpf_cnpj: string;
  customer_phone: string;
  customer_postal_code: string;
  customer_address: string;
  customer_address_number: string;
  customer_address_complement: string;
  customer_province: string;
  customer_city: string;
  customer_state: string;
}

function PerfilPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CustomerData>({
    customer_cpf_cnpj: "",
    customer_phone: "",
    customer_postal_code: "",
    customer_address: "",
    customer_address_number: "",
    customer_address_complement: "",
    customer_province: "",
    customer_city: "",
    customer_state: "",
  });

  useEffect(() => {
    // Carregar dados do tenant
    fetch("/api/tenant/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setFormData({
            customer_cpf_cnpj: data.profile.customer_cpf_cnpj || "",
            customer_phone: data.profile.customer_phone || "",
            customer_postal_code: data.profile.customer_postal_code || "",
            customer_address: data.profile.customer_address || "",
            customer_address_number: data.profile.customer_address_number || "",
            customer_address_complement: data.profile.customer_address_complement || "",
            customer_province: data.profile.customer_province || "",
            customer_city: data.profile.customer_city || "",
            customer_state: data.profile.customer_state || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const formatCPFCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      // CPF: 000.000.000-00
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ: 00.000.000/0000-00
      return cleaned
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validação básica
    if (!formData.customer_cpf_cnpj) {
      setError("CPF/CNPJ é obrigatório");
      return;
    }

    const cpfCnpjCleaned = formData.customer_cpf_cnpj.replace(/\D/g, "");
    if (cpfCnpjCleaned.length !== 11 && cpfCnpjCleaned.length !== 14) {
      setError("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/tenant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar dados");
      }

      setSuccess(true);
      
      // Se veio de um redirecionamento do checkout, voltar para lá
      setTimeout(() => {
        if (redirectTo.includes("/dashboard/pagamento")) {
          router.push(redirectTo);
        } else {
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar dados");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-primary-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        </div>

        {/* Seção de Assinatura */}
        <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-primary-600" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assinatura e Pagamento</h2>
                <p className="text-sm text-gray-600">Gerencie seu plano e forma de pagamento</p>
              </div>
            </div>
            <a
              href="/dashboard/pagamento"
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
            >
              <span>Gerenciar Assinatura</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Seção de Dados do Cliente */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dados do Cliente</h2>
          <p className="text-gray-600 mb-6">
            Preencha seus dados para realizar assinaturas e pagamentos. Essas informações são necessárias para processar pagamentos via Asaas.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="text-green-600" size={20} />
            <span className="text-green-800">Dados salvos com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CPF/CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF ou CNPJ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.customer_cpf_cnpj}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_cpf_cnpj: formatCPFCNPJ(e.target.value),
                })
              }
              maxLength={18}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={formData.customer_phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_phone: formatPhone(e.target.value),
                })
              }
              maxLength={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* CEP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP
            </label>
            <input
              type="text"
              value={formData.customer_postal_code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_postal_code: formatCEP(e.target.value),
                })
              }
              maxLength={9}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="00000-000"
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={formData.customer_address}
                onChange={(e) =>
                  setFormData({ ...formData, customer_address: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número
              </label>
              <input
                type="text"
                value={formData.customer_address_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_address_number: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123"
              />
            </div>
          </div>

          {/* Complemento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complemento
            </label>
            <input
              type="text"
              value={formData.customer_address_complement}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_address_complement: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Apto, Bloco, etc."
            />
          </div>

          {/* Bairro, Cidade, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={formData.customer_province}
                onChange={(e) =>
                  setFormData({ ...formData, customer_province: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.customer_city}
                onChange={(e) =>
                  setFormData({ ...formData, customer_city: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <input
                type="text"
                value={formData.customer_state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_state: e.target.value.toUpperCase(),
                  })
                }
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="RJ"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Dados
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    }>
      <PerfilPageContent />
    </Suspense>
  );
}
