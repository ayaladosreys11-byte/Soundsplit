"use client";
import { useState } from "react";

const STATUSES = ["DRAFT", "IN_REVIEW", "SUBMITTED", "LIVE", "REJECTED", "TAKEN_DOWN"];

export default function AdminReleaseRow({ release }: { release: any }) {
  const [status, setStatus] = useState(release.distributionStatus);
  const [showRevenue, setShowRevenue] = useState(false);
  const [source, setSource] = useState("Spotify");
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [msg, setMsg] = useState("");

  async function updateStatus(newStatus: string) {
    setStatus(newStatus);
    await fetch(`/api/admin/releases/${release.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function submitRevenue(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        releaseId: release.id,
        source,
        periodStart,
        periodEnd,
        grossAmountCents: Math.round(parseFloat(amount) * 100),
      }),
    });
    if (res.ok) {
      setMsg("Receita registada.");
      setAmount("");
    } else {
      const data = await res.json();
      setMsg(data.error?.formErrors?.[0] || "Erro.");
    }
  }

  return (
    <>
      <tr>
        <td>{release.title}</td>
        <td>{release.artist.artistName}</td>
        <td>{release.tracks.length}</td>
        <td>
          <select value={status} onChange={(e) => updateStatus(e.target.value)} style={{ marginBottom: 0 }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td>
          <button className="btn secondary" onClick={() => setShowRevenue(!showRevenue)}>
            {showRevenue ? "Fechar" : "+ Receita"}
          </button>
        </td>
      </tr>
      {showRevenue && (
        <tr>
          <td colSpan={5}>
            <form onSubmit={submitRevenue} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: "12px 0" }}>
              <div>
                <label>Fonte</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} style={{ marginBottom: 0 }}>
                  <option>Spotify</option>
                  <option>Apple Music</option>
                  <option>YouTube Music</option>
                  <option>Deezer</option>
                  <option>Amazon Music</option>
                </select>
              </div>
              <div>
                <label>Início período</label>
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ marginBottom: 0 }} required />
              </div>
              <div>
                <label>Fim período</label>
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ marginBottom: 0 }} required />
              </div>
              <div>
                <label>Valor bruto (€)</label>
                <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: 0 }} required />
              </div>
              <button className="btn">Registar</button>
              {msg && <span style={{ fontSize: 13, color: "var(--accent-2)" }}>{msg}</span>}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
