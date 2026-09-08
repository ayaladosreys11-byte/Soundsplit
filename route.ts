import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  releaseId: z.string(),
  source: z.string(), // "Spotify", "Apple Music", etc.
  periodStart: z.string(), // ISO date
  periodEnd: z.string(),
  grossAmountCents: z.number().int().positive(),
  currency: z.string().default("EUR"),
});

// Este endpoint é o ponto onde, no futuro, um relatório de royalties importado
// de um agregador (RouteNote, Revelator, etc.) entraria automaticamente.
// Por agora o admin regista manualmente o valor bruto recebido por release.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { releaseId, source, periodStart, periodEnd, grossAmountCents, currency } = parsed.data;

  const feePct = parseFloat(process.env.PLATFORM_FEE_PERCENT || "15");
  const artistAmountCents = Math.round(grossAmountCents * (1 - feePct / 100));

  const entry = await prisma.revenueEntry.create({
    data: {
      releaseId,
      source,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      grossAmountCents,
      platformFeePct: feePct,
      artistAmountCents,
      currency,
    },
  });

  return NextResponse.json({ entry });
}

// Lista todas as entradas de receita (visão do admin)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 403 });
  }

  const entries = await prisma.revenueEntry.findMany({
    include: { release: { include: { artist: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ entries });
}
