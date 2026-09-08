import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

// Cria (ou reutiliza) uma conta Stripe Connect Express para o artista
// e devolve o link de onboarding — onde o artista preenche os dados
// bancários/fiscais dele diretamente com a Stripe (nunca passam pelo teu servidor).
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: accountId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/dashboard/payouts?refresh=1`,
    return_url: `${baseUrl}/dashboard/payouts?onboarded=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
