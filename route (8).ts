import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

// Calcula o saldo disponível do artista: soma de royalties recebidas
// menos o que já foi pago ou está em processamento.
async function getAvailableBalance(artistId: string) {
  const releases = await prisma.release.findMany({
    where: { artistId },
    include: { revenueEntries: true },
  });
  const totalEarned = releases
    .flatMap((r) => r.revenueEntries)
    .reduce((sum, e) => sum + e.artistAmountCents, 0);

  const payouts = await prisma.payoutRequest.findMany({
    where: { artistId, status: { in: ["PENDING", "PROCESSING", "PAID"] } },
  });
  const totalPaidOrPending = payouts.reduce((sum, p) => sum + p.amountCents, 0);

  return totalEarned - totalPaidOrPending;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const available = await getAvailableBalance(session.userId);
  const history = await prisma.payoutRequest.findMany({
    where: { artistId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ availableCents: available, history });
}

const MIN_PAYOUT_CENTS = 1000; // mínimo de 10€ pra evitar taxas desproporcionais

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.stripeAccountId || !user.stripeOnboarded) {
    return NextResponse.json(
      { error: "Termina primeiro a configuração da tua conta de pagamentos." },
      { status: 400 }
    );
  }

  const available = await getAvailableBalance(session.userId);
  if (available < MIN_PAYOUT_CENTS) {
    return NextResponse.json(
      { error: `Saldo mínimo para levantamento: ${(MIN_PAYOUT_CENTS / 100).toFixed(2)}€.` },
      { status: 400 }
    );
  }

  // Cria o registo como PENDING; a transferência real via Stripe fica
  // a cargo de um job/admin que confirma fundos disponíveis na plataforma
  // antes de mover o dinheiro (evita transferir mais do que a plataforma recebeu de facto).
  const payout = await prisma.payoutRequest.create({
    data: {
      artistId: session.userId,
      amountCents: available,
      status: "PENDING",
    },
  });

  return NextResponse.json({ payout });
}
