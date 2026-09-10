"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", artistName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Erro ao criar conta.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h2 style={{ marginBottom: 24 }}>Criar conta de artista</h2>
      <form onSubmit={handleSubmit} className="card">
        {error && <div className="error">{error}</div>}
        <label>O teu nome</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Nome artístico</label>
        <input required value={form.artistName} onChange={(e) => setForm({ ...form, artistName: e.target.value })} />
        <label>Email</label>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Senha (mín. 8 caracteres)</label>
        <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "A criar..." : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
