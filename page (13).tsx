"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!audio) {
      setError("Escolhe o ficheiro de áudio.");
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.append("title", title);
    form.append("trackTitle", trackTitle);
    form.append("audio", audio);
    if (cover) form.append("cover", cover);

    const res = await fetch("/api/releases", { method: "POST", body: form });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao enviar.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 50, paddingBottom: 80 }}>
      <Link href="/dashboard">← Voltar</Link>
      <h2 style={{ marginTop: 16 }}>Novo lançamento</h2>
      <form onSubmit={handleSubmit} className="card">
        {error && <div className="error">{error}</div>}

        <label>Título do lançamento (álbum/single)</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Título da faixa</label>
        <input required value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)} />

        <label>Ficheiro de áudio (WAV, FLAC ou MP3 — máx. 200MB)</label>
        <input required type="file" accept=".wav,.flac,.mp3,audio/*" onChange={(e) => setAudio(e.target.files?.[0] || null)} />

        <label>Capa (opcional aqui, mas obrigatória antes de ir a distribuição — mín. 3000x3000px)</label>
        <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />

        <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 18px" }}>
          Depois de enviado, o teu lançamento fica em <strong>análise</strong> até a nossa
          equipa o rever e submeter às plataformas de streaming.
        </p>

        <button className="btn" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "A enviar..." : "Enviar lançamento"}
        </button>
      </form>
    </div>
  );
}
