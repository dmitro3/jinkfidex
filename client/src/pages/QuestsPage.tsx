import { useState } from "react";
import { useQuests } from "../hooks/useQuest";
import QuestCard from "../components/quest/QuestCard";
import { Loader, Trophy, Zap, Filter } from "lucide-react";

const FILTERS = ["ALL", "ACTIVE", "FEATURED"] as const;
type Filter = typeof FILTERS[number];

export default function QuestsPage() {
  const { data: serverQuests, isLoading, error } = useQuests();
  const [filter, setFilter] = useState<Filter>("ALL");

  const quests = serverQuests ?? [];

  const now = Date.now();
  const filtered = quests.filter(q => {
    if (filter === "ACTIVE") return new Date(q.startDate).getTime() <= now && new Date(q.endDate).getTime() > now;
    if (filter === "FEATURED") return q.featured;
    return true;
  });

  const featured = filtered.filter(q => q.featured);
  const regular  = filtered.filter(q => !q.featured);

  const totalPts = quests.reduce((s, q) => s + q.tasks.reduce((a, t) => a + t.points, 0), 0);
  const activeCount = quests.filter(q => new Date(q.endDate).getTime() > now).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 2, height: 22, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
          <h1 style={{
            fontWeight: 900, fontSize: 24, margin: 0,
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.08em", color: "var(--text)",
          }}>
            QUESTS
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
          Complete tasks · Earn XP · Unlock rewards
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "0.75rem", marginBottom: "2rem",
      }}>
        {[
          { icon: Trophy, label: "TOTAL QUESTS", value: quests.length },
          { icon: Zap,    label: "ACTIVE NOW",   value: activeCount },
          { icon: Filter, label: "TOTAL XP",     value: `${totalPts.toLocaleString()} pts` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderLeft: "3px solid var(--accent)",
            padding: "0.75rem 1rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <Icon size={14} color="var(--accent)" style={{ flexShrink: 0, opacity: 0.7 }} />
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{label}</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", fontFamily: "'Rajdhani', sans-serif" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.75rem" }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.35rem 0.9rem", height: 30,
              background: filter === f ? "var(--accent)" : "transparent",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              color: filter === f ? "var(--bg-deep)" : "var(--text-muted)",
              cursor: "pointer", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.12em",
              fontFamily: "'Share Tech Mono', monospace",
              transition: "all 0.12s",
              boxShadow: filter === f ? "0 0 14px var(--accent-glow)" : "none",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <Loader size={22} style={{ animation: "spin 1s linear infinite" }} color="var(--accent)" />
        </div>
      )}

      {!isLoading && (
        <>
          {error && (
            <div style={{
              padding: "0.6rem 0.9rem", marginBottom: "1.5rem",
              background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)",
              borderLeft: "3px solid #f97316",
              fontSize: 11, color: "var(--text-muted)",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              Could not load quests — check your connection and try again.
            </div>
          )}

          {featured.length > 0 && (
            <section style={{ marginBottom: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ width: 2, height: 14, background: "#eab308" }} />
                <h2 style={{
                  fontWeight: 800, fontSize: 13, margin: 0,
                  letterSpacing: "0.18em", color: "#eab308",
                  fontFamily: "'Share Tech Mono', monospace",
                }}>FEATURED</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {featured.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {featured.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ width: 2, height: 14, background: "var(--text-muted)" }} />
                  <h2 style={{
                    fontWeight: 800, fontSize: 13, margin: 0,
                    letterSpacing: "0.18em", color: "var(--text-muted)",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>ALL QUESTS</h2>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {regular.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div style={{
              textAlign: "center", padding: "4rem",
              color: "var(--text-muted)", fontSize: 13,
              fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: "0.1em",
            }}>
              NO QUESTS MATCH THIS FILTER
            </div>
          )}
        </>
      )}
    </div>
  );
}
