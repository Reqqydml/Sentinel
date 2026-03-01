async function getHealth() {
  const api = process.env.NEXT_PUBLIC_SENTINEL_API || "http://localhost:8000";
  try {
    const res = await fetch(`${api}/health`, { cache: "no-store" });
    if (!res.ok) return "offline";
    const data = (await res.json()) as { status: string };
    return data.status;
  } catch {
    return "offline";
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="page">
      <section className="hero">
        <h1>Sentinel Chess Integrity Platform</h1>
        <p className="small">
          FIDE-style, explainable multi-signal anomaly detection. This is the operator shell for reviews.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <div className="small">API Status</div>
          <div className="kpi">{health}</div>
        </article>
        <article className="card">
          <div className="small">Risk Policy</div>
          <div className="kpi">3-of-5</div>
          <div className="small">Minimum independent triggers for Elevated+</div>
        </article>
        <article className="card">
          <div className="small">Decisioning</div>
          <div className="kpi">Human Gate</div>
          <div className="small">High Statistical Anomaly requires arbiter review</div>
        </article>
      </section>
    </main>
  );
}
