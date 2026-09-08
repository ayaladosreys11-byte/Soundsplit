import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const VALID = ["DRAFT", "IN_REVIEW", "SUBMITTED", "LIVE", "REJECTED", "TAKEN_DOWN"];

// Ponto de integração futuro: quando ligares a API de um agregador (ex: RouteNote),
// é aqui que, em vez de só atualizar o status manualmente, vais chamar a API deles
// pra submeter o release de verdade e guardar o UPC/ISRC que eles devolverem.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao admin." }, { status: 403 });
  }

  const { status } = await req.json();
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const release = await prisma.release.update({
    where: { id: params.id },
    data: { distributionStatus: status },
  });

  return NextResponse.json({ release });
}
