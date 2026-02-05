"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  details?: any;
  deviceId?: string;
  orderId?: string;
}

export default function LogsImpressoraPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Verificar se é super admin e redirecionar
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && !data.user.tenant_id) {
          router.push("/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs/impressora?limit=200");
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        // Auto-scroll para o final
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000); // Atualizar a cada 2 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-500";
      case "warn":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const clearLogs = async () => {
    if (confirm("Tem certeza que deseja limpar os logs?")) {
      // Limpar logs (seria necessário implementar endpoint DELETE)
      setLogs([]);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Logs da Impressora</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe em tempo real os logs de conexão e impressão
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${
              autoRefresh ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {autoRefresh ? "⏸️ Pausar" : "▶️ Retomar"} Auto-refresh
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            🔄 Atualizar
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            🗑️ Limpar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            Logs ({logs.length} entradas)
            {autoRefresh && (
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                Atualizando...
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum log encontrado
          </div>
        ) : (
          <div
            className="h-[calc(100vh-250px)] overflow-y-auto border rounded p-4"
            ref={scrollRef}
          >
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    log.level === "error"
                      ? "bg-red-50 border-red-500"
                      : log.level === "warn"
                      ? "bg-yellow-50 border-yellow-500"
                      : log.level === "success"
                      ? "bg-green-50 border-green-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full ${getLevelColor(
                            log.level
                          )}`}
                        />
                        <span
                          className={`px-2 py-1 text-xs rounded border ${
                            log.level === "error"
                              ? "border-red-500 text-red-700"
                              : log.level === "warn"
                              ? "border-yellow-500 text-yellow-700"
                              : log.level === "success"
                              ? "border-green-500 text-green-700"
                              : "border-blue-500 text-blue-700"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.deviceId && (
                          <span className="px-2 py-1 text-xs border rounded">
                            📱 {log.deviceId.substring(0, 8)}...
                          </span>
                        )}
                        {log.orderId && (
                          <span className="px-2 py-1 text-xs border rounded">
                            📦 {log.orderId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            Ver detalhes
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
