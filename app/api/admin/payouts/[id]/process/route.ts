import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

// O admin confirma manualmente cada pagamento antes da transferência real acontecer —
// uma camada de segurança simples para o MVP. Numa versão mais madura, isto pode
// ser automatizado com verificações de saldo da conta Stripe da plataforma.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 403 });
  }

  const payout = await prisma.payoutRequest.findUniqueOrThrow({
    where: { id: params.id },
    include: { artist: true },
  });

  if (payout.status !== "PENDING") {
    return NextResponse.json({ error: "Este pagamento já foi processado." }, { status: 400 });
  }
  if (!payout.artist.stripeAccountId) {
    return NextResponse.json({ error: "Artista sem conta Stripe configurada." }, { status: 400 });
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: payout.amountCents,
      currency: payout.currency.toLowerCase(),
      destination: payout.artist.stripeAccountId,
    });

    const updated = await prisma.payoutRequest.update({
      where: { id: payout.id },
      data: { status: "PAID", stripeTransferId: transfer.id, processedAt: new Date() },
    });

    return NextResponse.json({ payout: updated });
  } catch (err: any) {
    await prisma.payoutRequest.update({
      where: { id: payout.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ error: err.message || "Falha na transferência." }, { status: 500 });
  }
}
