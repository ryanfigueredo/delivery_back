import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const orderId = params.id;

  try {
    // Verifica se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      const responseTime = Date.now() - startTime;
      console.log(
        `[MARK-PRINTED] Pedido não encontrado - ID: ${orderId} - Tempo de resposta: ${responseTime}ms`
      );

      return NextResponse.json(
        { message: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Atualiza o status do pedido para 'printed' e limpa solicitação de impressão
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "printed", print_requested_at: null },
    });

    const responseTime = Date.now() - startTime;

    // Log detalhado para monitoramento
    console.log(`[MARK-PRINTED] Pedido atualizado com sucesso`);
    console.log(`  - ID: ${orderId}`);
    console.log(`  - Status anterior: ${existingOrder.status}`);
    console.log(`  - Status novo: ${updatedOrder.status}`);
    console.log(`  - Tempo de resposta: ${responseTime}ms`);
    console.log(`  - Timestamp: ${new Date().toISOString()}`);

    return NextResponse.json(
      {
        message: "Pedido marcado como impresso",
        order: updatedOrder,
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[MARK-PRINTED] Erro ao atualizar pedido - ID: ${orderId} - Tempo de resposta: ${responseTime}ms`
    );
    console.error("Erro detalhado:", error);

    return NextResponse.json(
      {
        message: "Erro ao atualizar status do pedido",
        error: String(error),
        responseTime: `${responseTime}ms`,
      },
      { status: 500 }
    );
  }
}
