/**
 * Consulta status do pedido mais recente pelo wa_id (customer_phone).
 */

import { prisma } from "./prisma";

const STATUS_MAP: Record<string, string> = {
  pending: "⏳ Preparando",
  printed: "🍳 Na chapa",
  out_for_delivery: "🚚 Saiu para entrega",
  finished: "✅ Entregue/Finalizado",
};

export async function getOrderStatus(
  waId: string,
  tenantSlug?: string
): Promise<string> {
  const fallback =
    "Não foi possível consultar o status. Tente novamente ou fale com um atendente.";
  try {
    const phone = String(waId || "").replace(/\D/g, "");
    if (!phone) return "Você não possui pedidos ativos no momento.";

    let tenantId: string | null = null;
    if (tenantSlug && String(tenantSlug).trim()) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: String(tenantSlug).trim() },
          select: { id: true },
        });
        tenantId = tenant?.id ?? null;
      } catch {
        // tenant não encontrado ou Prisma lento - continua sem filtro
      }
    }

    const phoneClean = phone.replace(/\D/g, "");
    const phoneSuffix =
      phoneClean.length >= 11 ? phoneClean.slice(-11) : phoneClean;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customer_phone: { contains: phoneClean } },
          { customer_phone: { contains: phoneSuffix } },
        ],
        ...(tenantId && { tenant_id: tenantId }),
        status: { in: ["pending", "printed", "out_for_delivery"] },
      },
      orderBy: { created_at: "desc" },
      take: 1,
    });

    const order = orders[0];
    if (!order) return "Você não possui pedidos ativos no momento.";

    const statusLabel =
      STATUS_MAP[order.status] || order.status || "Em processamento";
    const displayId =
      order.display_id || `#${order.order_number || order.id.slice(0, 8)}`;
    return `📦 *Status do Pedido ${displayId}*\n\n${statusLabel}\n\nEm caso de dúvidas, fale com um atendente.`;
  } catch (e) {
    console.error("[OrderStatus] Erro:", e);
    return fallback;
  }
}
