import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Lista os releases do artista autenticado
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const releases = await prisma.release.findMany({
    where: { artistId: session.userId },
    include: { tracks: true, revenueEntries: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ releases });
}

// Cria um novo release com uma faixa (upload de áudio + capa)
// Espera multipart/form-data: title, trackTitle, audio (ficheiro), cover (ficheiro, opcional)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const form = await req.formData();
  const title = form.get("title")?.toString();
  const trackTitle = form.get("trackTitle")?.toString();
  const audio = form.get("audio") as File | null;
  const cover = form.get("cover") as File | null;

  if (!title || !trackTitle || !audio) {
    return NextResponse.json({ error: "Título, título da faixa e áudio são obrigatórios." }, { status: 400 });
  }

  // valida tipo/tamanho básico do áudio
  const allowedAudio = ["audio/wav", "audio/x-wav", "audio/flac", "audio/mpeg"];
  if (!allowedAudio.includes(audio.type)) {
    return NextResponse.json(
      { error: "Formato de áudio não suportado. Usa WAV, FLAC ou MP3." },
      { status: 400 }
    );
  }
  const MAX_SIZE = 200 * 1024 * 1024; // 200MB
  if (audio.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ficheiro de áudio demasiado grande (máx. 200MB)." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const audioExt = audio.name.split(".").pop();
  const audioFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${audioExt}`;
  const audioBuffer = Buffer.from(await audio.arrayBuffer());
  await writeFile(path.join(uploadsDir, audioFileName), audioBuffer);

  let coverUrl: string | undefined;
  if (cover && cover.size > 0) {
    const coverExt = cover.name.split(".").pop();
    const coverFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${coverExt}`;
    const coverBuffer = Buffer.from(await cover.arrayBuffer());
    await writeFile(path.join(uploadsDir, coverFileName), coverBuffer);
    coverUrl = `/uploads/${coverFileName}`;
  }

  const release = await prisma.release.create({
    data: {
      title,
      artistId: session.userId,
      coverArtUrl: coverUrl,
      distributionStatus: "IN_REVIEW",
      tracks: {
        create: [{ title: trackTitle, audioUrl: `/uploads/${audioFileName}`, trackNumber: 1 }],
      },
    },
    include: { tracks: true },
  });

  return NextResponse.json({ release });
}
