import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminReleaseRow from "./AdminReleaseRow";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const releases = await prisma.release.findMany({
    include: { artist: true, tracks: true },
    orderBy: { createdAt: "desc" },
  });

  const pendingPayouts = await prisma.payoutRequest.findMany({
    where: { status: "PENDING" },
    include: { artist: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <nav className="nav"><strong>SoundSplit — Admin</strong></nav>

      <div className="card" style={{ margin: "32px 0" }}>
        <h3 style={{ marginTop: 0 }}>Pagamentos pendentes ({pendingPayouts.length})</h3>
        {pendingPayouts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Nada pendente.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Artista</th><th>Valor</th><th>Ação</th></tr></thead>
            <tbody>
              {pendingPayouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.artist.artistName}</td>
                  <td>{(p.amountCents / 100).toFixed(2)}€</td>
                  <td>
                    <form action={`/api/admin/payouts/${p.id}/process`} method="post">
                      <button className="btn secondary">Processar pagamento</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Lançamentos ({releases.length})</h3>
        <table className="table">
          <thead>
            <tr><th>Título</th><th>Artista</th><th>Faixas</th><th>Estado</th><th>Registar receita</th></tr>
          </thead>
          <tbody>
            {releases.map((r) => (
              <AdminReleaseRow key={r.id} release={r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
