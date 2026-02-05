"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Wifi, WifiOff, Settings, Copy } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  whatsapp_phone?: string | null;
  bot_configured?: boolean | null;
  bot_last_heartbeat?: string | null;
  _count?: {
    orders: number;
    users: number;
  };
}

interface BotStatus {
  tenant_id: string;
  tenant_name: string;
  is_online: boolean;
  last_heartbeat?: string;
  total_orders_today: number;
  total_orders_month: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  tenant_id: string;
}

export default function RestaurantesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState<string | null>(null);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<{
    name: string;
    slug: string;
    api_key: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    username: "",
    password: "",
    userName: "",
    whatsapp_phone: "",
    meta_phone_number_id: "",
    meta_access_token: "",
    meta_verify_token: "",
  });

  useEffect(() => {
    loadData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Carregar tenants
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
      }

      // Carregar status dos bots
      const botsRes = await fetch("/api/admin/bot-status");
      const botsData = await botsRes.json();
      if (botsData.success) {
        setBotStatuses(botsData.bots || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          createUser: showUserForm !== null,
          username: showUserForm ? formData.username : undefined,
          password: showUserForm ? formData.password : undefined,
          userName: showUserForm ? formData.userName : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const tenant = data.tenant;
        setCreatedTenant(tenant);
        setShowCreateForm(false);
        setShowUserForm(null);
        setFormData({
          name: "",
          slug: "",
          username: "",
          password: "",
          userName: "",
          whatsapp_phone: "",
          meta_phone_number_id: "",
          meta_access_token: "",
          meta_verify_token: "",
        });
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar tenant:", error);
      alert("❌ Erro ao criar restaurante");
    }
  };

  const handleCreateUser = async (tenantId: string) => {
    if (!formData.username || !formData.password) {
      alert("Preencha email e senha");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          username: formData.username,
          password: formData.password,
          name: formData.userName || formData.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Usuário criado com sucesso!");
        setShowUserForm(null);
        setFormData({
          name: "",
          slug: "",
          username: "",
          password: "",
          userName: "",
          whatsapp_phone: "",
          meta_phone_number_id: "",
          meta_access_token: "",
          meta_verify_token: "",
        });
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      alert("❌ Erro ao criar usuário");
    }
  };

  const toggleTenantStatus = async (
    tenantId: string,
    currentStatus: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar tenant:", error);
      alert("❌ Erro ao atualizar restaurante");
    }
  };

  const handleSaveWhatsAppConfig = async (tenantId: string) => {
    if (!formData.whatsapp_phone || !formData.meta_phone_number_id || !formData.meta_access_token) {
      alert("Preencha pelo menos: Telefone, Phone Number ID e Access Token");
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/whatsapp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_phone: formData.whatsapp_phone,
          meta_phone_number_id: formData.meta_phone_number_id,
          meta_access_token: formData.meta_access_token,
          meta_verify_token: formData.meta_verify_token || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Configuração do WhatsApp salva com sucesso!");
        setShowWhatsAppForm(null);
        setFormData({
          name: "",
          slug: "",
          username: "",
          password: "",
          userName: "",
          whatsapp_phone: "",
          meta_phone_number_id: "",
          meta_access_token: "",
          meta_verify_token: "",
        });
        loadData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar configuração WhatsApp:", error);
      alert("❌ Erro ao salvar configuração");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                Gerenciar Restaurantes
              </h1>
              <p className="text-sm text-gray-500">
                Criar e gerenciar restaurantes do sistema
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                ← Voltar
              </Link>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                {showCreateForm ? "Cancelar" : "+ Novo Restaurante"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert de Sucesso com API Key */}
        {createdTenant && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2
                    size={22}
                    className="text-green-600 flex-shrink-0"
                  />
                  Restaurante criado com sucesso!
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Nome:</strong> {createdTenant.name}
                  </p>
                  <p>
                    <strong>Slug:</strong> {createdTenant.slug}
                  </p>
                  <div className="bg-white p-3 rounded border border-green-300 mt-3">
                    <p className="font-semibold text-green-900 mb-1">
                      API Key (IMPORTANTE):
                    </p>
                    <code className="text-xs break-all text-gray-800 block">
                      {createdTenant.api_key}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdTenant.api_key);
                        alert("API Key copiada!");
                      }}
                      className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Copiar API Key
                    </button>
                  </div>
                  <p className="text-green-800 mt-3">
                    ⚠️ <strong>Salve esta API Key!</strong> Ela será necessária
                    para configurar o bot WhatsApp.
                  </p>
                  <div className="bg-blue-50 p-3 rounded mt-3">
                    <p className="text-sm text-blue-900">
                      <strong>Configuração do Bot WhatsApp:</strong>
                      <br />
                      No Railway/Render, adicione as variáveis:
                      <br />
                      <code className="text-xs block mt-1">
                        TENANT_ID={createdTenant.slug}
                      </code>
                      <code className="text-xs block">
                        TENANT_API_KEY={createdTenant.api_key}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreatedTenant(null)}
                className="text-green-600 hover:text-green-800 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Formulário de Criação */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">
              Criar Novo Restaurante
            </h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Restaurante *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Pizzaria do João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (identificador único) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: pizzaria-do-joao"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Apenas letras minúsculas, números e hífens
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createUser"
                  checked={showUserForm !== null}
                  onChange={(e) =>
                    setShowUserForm(e.target.checked ? "new" : null)
                  }
                  className="mr-2"
                />
                <label htmlFor="createUser" className="text-sm text-gray-700">
                  Criar usuário admin agora
                </label>
              </div>

              {showUserForm && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Dados do Usuário Admin
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (username) *
                    </label>
                    <input
                      type="email"
                      required={showUserForm !== null}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="admin@pizzaria.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required={showUserForm !== null}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Senha inicial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Usuário
                    </label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) =>
                        setFormData({ ...formData, userName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ex: João Admin"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Criar Restaurante
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setShowUserForm(null);
                    setFormData({
                      name: "",
                      slug: "",
                      username: "",
                      password: "",
                      userName: "",
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Restaurantes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                Restaurantes Cadastrados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bot WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pedidos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenants.map((tenant) => {
                    const botStatus = botStatuses.find(b => b.tenant_id === tenant.id);
                    const isBotOnline = botStatus?.is_online || false;
                    return (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {tenant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleTenantStatus(tenant.id, tenant.is_active)
                            }
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tenant.is_active
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tenant.is_active ? "Ativo" : "Inativo"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {tenant.bot_configured ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isBotOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                  <span className={`text-xs font-medium ${isBotOnline ? 'text-green-600' : 'text-red-600'}`}>
                                    {isBotOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                                {botStatus && (
                                  <span className="text-xs text-gray-500">
                                    {botStatus.total_orders_today} pedidos hoje
                                  </span>
                                )}
                                {tenant.whatsapp_phone && (
                                  <span className="text-xs text-gray-400 font-mono">
                                    {tenant.whatsapp_phone}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Não configurado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {tenant._count?.orders || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {tenant._count?.users || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                          {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                const currentTenant = tenants.find((t) => t.id === tenant.id);
                                if (showWhatsAppForm === tenant.id) {
                                  setShowWhatsAppForm(null);
                                } else {
                                  setShowWhatsAppForm(tenant.id);
                                  // Pré-preencher campos se já existirem
                                  setFormData({
                                    ...formData,
                                    whatsapp_phone: currentTenant?.whatsapp_phone || "",
                                    meta_phone_number_id: "",
                                    meta_access_token: "",
                                    meta_verify_token: "",
                                  });
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                              title="Configurar WhatsApp"
                            >
                              <Settings size={14} />
                              WhatsApp
                            </button>
                            <button
                              onClick={() =>
                                setShowUserForm(
                                  showUserForm === tenant.id ? null : tenant.id
                                )
                              }
                              className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                            >
                              {showUserForm === tenant.id ? "Cancelar" : "+ Usuário"}
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Tem certeza que deseja ${
                                      tenant.is_active ? "desativar" : "ativar"
                                    } ${tenant.name}?`
                                  )
                                ) {
                                  toggleTenantStatus(tenant.id, tenant.is_active);
                                }
                              }}
                              className={`text-xs font-medium ${
                                tenant.is_active
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-amber-600 hover:text-amber-800"
                              }`}
                            >
                              {tenant.is_active ? "Desativar" : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulário de Criar Usuário para Tenant Existente */}
        {showUserForm && showUserForm !== "new" && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 border-2 border-primary-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                Criar Usuário Admin para{" "}
                {tenants.find((t) => t.id === showUserForm)?.name}
              </h2>
              <button
                onClick={() => {
                  setShowUserForm(null);
                  setFormData({
                    name: "",
                    slug: "",
                    username: "",
                    password: "",
                    userName: "",
                    whatsapp_phone: "",
                    meta_phone_number_id: "",
                    meta_access_token: "",
                    meta_verify_token: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateUser(showUserForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (username) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="admin@pizzaria.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Senha inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Usuário
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: João Admin"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Criar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(null);
                    setFormData({
                      name: "",
                      slug: "",
                      username: "",
                      password: "",
                      userName: "",
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulário de Configuração WhatsApp */}
        {showWhatsAppForm && showWhatsAppForm !== "new" && (() => {
          const tenant = tenants.find((t) => t.id === showWhatsAppForm);
          if (!tenant) return null;
          return (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                Configurar WhatsApp para {tenant.name}
              </h2>
              <button
                onClick={() => {
                  setShowWhatsAppForm(null);
                  setFormData({
                    ...formData,
                    whatsapp_phone: "",
                    meta_phone_number_id: "",
                    meta_access_token: "",
                    meta_verify_token: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-900">
                  <strong>📋 Passos para configurar:</strong>
                  <br />
                  1. Criar conta no Meta Business (business.facebook.com)
                  <br />
                  2. Criar App WhatsApp Business
                  <br />
                  3. Adicionar número de telefone e verificar
                  <br />
                  4. Obter Phone Number ID e Access Token
                  <br />
                  5. Configurar webhook apontando para: <code className="text-xs bg-white px-1 rounded">https://pedidos.dmtn.com.br/api/bot/webhook</code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone WhatsApp (com código do país) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsapp_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_phone: e.target.value.replace(/\D/g, "") })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5521999999999"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Apenas números, com código do país (55 para Brasil)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Phone Number ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.meta_phone_number_id}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_phone_number_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Access Token *
                </label>
                <input
                  type="password"
                  required
                  value={formData.meta_access_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_access_token: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="EAAxxxxxxxxxxxxx"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Token de acesso permanente da Meta Cloud API
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Verify Token (opcional)
                </label>
                <input
                  type="text"
                  value={formData.meta_verify_token}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_verify_token: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="meu_token_secreto"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Token para verificação do webhook (pode ser qualquer string)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSaveWhatsAppConfig(showWhatsAppForm)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Salvar Configuração
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppForm(null);
                    setFormData({
                      ...formData,
                      whatsapp_phone: "",
                      meta_phone_number_id: "",
                      meta_access_token: "",
                      meta_verify_token: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
