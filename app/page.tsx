import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <nav className="nav">
        <strong>SoundSplit</strong>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/login">Entrar</Link>
          <Link href="/register" className="btn">Começar grátis</Link>
        </div>
      </nav>

      <section style={{ padding: "90px 0 60px", maxWidth: 640 }}>
        <h1 style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 20 }}>
          Distribui a tua música. Recebe a tua parte.
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, marginBottom: 32 }}>
          Envia as tuas faixas para as principais plataformas de streaming e acompanha,
          em tempo real, quanto estás a ganhar — com pagamentos diretos para a tua conta.
        </p>
        <Link href="/register" className="btn">Criar a minha conta de artista</Link>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, paddingBottom: 100 }}>
        <div className="card">
          <h3>Distribuição simples</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Envia a tua música uma vez e acompanha o estado de cada lançamento no teu painel.
          </p>
        </div>
        <div className="card">
          <h3>Royalties transparentes</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Cada cêntimo recebido das plataformas é registado e dividido automaticamente contigo.
          </p>
        </div>
        <div className="card">
          <h3>Pagamentos diretos</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Liga a tua conta bancária via Stripe e levanta o teu saldo quando quiseres.
          </p>
        </div>
      </section>
    </div>
  );
}
