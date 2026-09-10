"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao entrar.");
      return;
    }
    router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 80 }}>
      <h2 style={{ marginBottom: 24 }}>Entrar</h2>
      <form onSubmit={handleSubmit} className="card">
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Senha</label>
        <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
