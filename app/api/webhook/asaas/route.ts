import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook do Asaas para receber notificações de pagamento
 * Documentação: https://docs.asaas.com/docs/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token do webhook
    const webhookToken = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!expectedToken || webhookToken !== expectedToken) {
      console.warn("[Asaas Webhook] Token inválido ou não configurado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event;
    const payment = body.payment;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment?.id,
      subscriptionId: payment?.subscription,
      status: payment?.status,
    });

    // Buscar tenant pelo externalReference ou subscription_id
    let tenant = null;

    if (payment?.subscription) {
      tenant = await prisma.tenant.findFirst({
        where: { asaas_subscription_id: payment.subscription },
      });
    }

    if (!tenant && payment?.externalReference) {
      tenant = await prisma.tenant.findUnique({
        where: { id: payment.externalReference },
      });
    }

    if (!tenant) {
      console.warn("[Asaas Webhook] Tenant não encontrado", {
        subscriptionId: payment?.subscription,
        externalReference: payment?.externalReference,
      });
      return NextResponse.json({ success: true, message: "Tenant não encontrado" });
    }

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        // Pagamento confirmado - atualizar tenant
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "active",
            subscription_payment_date: payment.paymentDate
              ? new Date(payment.paymentDate)
              : new Date(),
            subscription_expires_at: payment.dueDate
              ? new Date(payment.dueDate)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          },
        });
        console.log(`[Asaas Webhook] Pagamento confirmado para tenant: ${tenant.id}`);
        break;

      case "PAYMENT_OVERDUE":
        // Pagamento vencido
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "expired",
          },
        });
        console.log(`[Asaas Webhook] Pagamento vencido para tenant: ${tenant.id}`);
        break;

      case "PAYMENT_REFUNDED":
        // Pagamento estornado
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Asaas Webhook] Pagamento estornado para tenant: ${tenant.id}`);
        break;

      case "SUBSCRIPTION_DELETED":
        // Assinatura cancelada
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscription_status: "cancelled",
          },
        });
        console.log(`[Asaas Webhook] Assinatura cancelada para tenant: ${tenant.id}`);
        break;

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Asaas Webhook] Erro:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
