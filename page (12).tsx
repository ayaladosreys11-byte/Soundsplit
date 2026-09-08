import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatCents(cents: number, currency = "EUR") {
  return (cents / 100).toLocaleString("pt-PT", { style: "currency", currency });
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const releases = await prisma.release.findMany({
    where: { artistId: session.userId },
    include: { tracks: true, revenueEntries: true },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnedCents = releases
    .flatMap((r) => r.revenueEntries)
    .reduce((sum, e) => sum + e.artistAmountCents, 0);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <nav className="nav">
        <strong>SoundSplit</strong>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard/payouts">Pagamentos</Link>
          <Link href="/dashboard/upload" className="btn">+ Novo lançamento</Link>
        </div>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, margin: "32px 0" }}>
        <div className="card">
          <div className="stat-label">Total ganho (líquido)</div>
          <div className="stat">{formatCents(totalEarnedCents)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Lançamentos</div>
          <div className="stat">{releases.length}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Os teus lançamentos</h3>
        {releases.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Ainda não tens nenhum lançamento. Cria o primeiro!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Faixas</th>
                <th>Estado</th>
                <th>Ganhos</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => {
                const earned = r.revenueEntries.reduce((s, e) => s + e.artistAmountCents, 0);
                return (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.tracks.length}</td>
                    <td><span className={`badge ${r.distributionStatus.toLowerCase()}`}>{statusLabel(r.distributionStatus)}</span></td>
                    <td>{formatCents(earned)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Rascunho",
    IN_REVIEW: "Em análise",
    SUBMITTED: "Submetido",
    LIVE: "No ar",
    REJECTED: "Rejeitado",
    TAKEN_DOWN: "Removido",
  };
  return map[status] || status;
}
