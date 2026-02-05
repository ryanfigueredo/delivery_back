import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAsaasSubscription, PLAN_PRICES } from "@/lib/asaas";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || !authUser.tenant_id) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType } = body;

    if (!planType || !["basic", "complete", "premium"].includes(planType)) {
      return NextResponse.json(
        { success: false, error: "Plano inválido" },
        { status: 400 }
      );
    }

    // Buscar tenant com dados completos
    const tenant = await prisma.tenant.findUnique({
      where: { id: authUser.tenant_id },
      select: {
        id: true,
        name: true,
        slug: true,
        asaas_subscription_id: true,
        asaas_customer_id: true,
        plan_type: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    // Se não tem assinatura, redirecionar para criar uma nova (não deve chegar aqui, mas por segurança)
    if (!tenant.asaas_subscription_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Assinatura não encontrada. Por favor, crie uma nova assinatura.",
          shouldCreateNew: true 
        },
        { status: 400 }
      );
    }

    // Verificar se já está no mesmo plano
    if (tenant.plan_type === planType) {
      return NextResponse.json(
        { success: false, error: "Você já está neste plano" },
        { status: 400 }
      );
    }

    const newValue = PLAN_PRICES[planType as keyof typeof PLAN_PRICES];

    // Atualizar assinatura no Asaas
    const updatedSubscription = await updateAsaasSubscription(
      tenant.asaas_subscription_id,
      {
        value: newValue,
        description: `Assinatura ${planType} - Pedidos Express`,
      }
    );

    // Atualizar tenant no banco
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan_type: planType,
        subscription_status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plano atualizado com sucesso",
      planType,
      newValue,
    });
  } catch (error: any) {
    console.error("[Update Plan] Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao atualizar plano",
      },
      { status: 500 }
    );
  }
}
