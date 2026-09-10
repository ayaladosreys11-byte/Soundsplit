"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

type Payout = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
};

export default function PayoutsPage() {
  const [available, setAvailable] = useState(0);
  const [history, setHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/payouts");
    const data = await res.json();
    setAvailable(data.availableCents || 0);
    setHistory(data.history || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function connectStripe() {
    setBusy(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (data.url) window.location.href = data.url;
  }

  async function requestPayout() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/payouts", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    load();
  }

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 50, paddingBottom: 80 }}>
      <Link href="/dashboard">← Voltar</Link>
      <h2 style={{ marginTop: 16 }}>Pagamentos</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="stat-label">Saldo disponível</div>
        <div className="stat">{loading ? "..." : formatCents(available)}</div>
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <button className="btn secondary" onClick={connectStripe} disabled={busy}>
            Configurar conta de pagamento
          </button>
          <button className="btn" onClick={requestPayout} disabled={busy || available < 1000}>
            Pedir levantamento
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14 }}>
          Levantamento mínimo: 10€. Precisas de configurar a tua conta de pagamento (Stripe) uma única vez.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Histórico</h3>
        {history.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Ainda sem pedidos de pagamento.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Data</th><th>Valor</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleDateString("pt-PT")}</td>
                  <td>{formatCents(p.amountCents)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
