import { useState } from "react";
import { Droplets, Plus, Zap, ArrowLeftRight, Layers } from "lucide-react";
import AddLiquidity from "../components/pool/AddLiquidity";
import RemoveLiquidity from "../components/pool/RemoveLiquidity";
import PoolList from "../components/pool/PoolList";
import V3PositionManager from "../components/pool/V3PositionManager";
import V4PositionManager from "../components/pool/V4PositionManager";

type Tab = "pools" | "v2-add" | "v2-remove" | "v3" | "v4";

const BROWSE_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "pools", label: "All Pools", icon: <Layers size={13} /> },
];

const ADD_TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
  { id: "v2-add",    label: "V2 Add",     icon: <Plus size={13} />,          badge: "V2",  badgeColor: "#60a5fa" },
  { id: "v2-remove", label: "V2 Remove",  icon: <ArrowLeftRight size={13} />, badge: "V2",  badgeColor: "#60a5fa" },
  { id: "v3",        label: "Concentrated", icon: <Droplets size={13} />,    badge: "V3",  badgeColor: "#a78bfa" },
  { id: "v4",        label: "Hooks",       icon: <Zap size={13} />,          badge: "V4",  badgeColor: "var(--neon)" },
];

export default function PoolPage() {
  const [tab, setTab] = useState<Tab>("pools");

  const isAddMode = tab !== "pools";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 30, marginBottom: "0.25rem", letterSpacing: "-0.5px" }}>
            Liquidity
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Browse pools or provide concentrated liquidity to earn fees
          </p>
        </div>

        {/* Quick-add buttons */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {tab === "pools" && (
            <button
              onClick={() => setTab("v3")}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                borderRadius: 10, border: "1px solid rgba(167,139,250,0.4)",
                background: "rgba(167,139,250,0.1)", color: "#a78bfa",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              <Plus size={14} /> New Position
            </button>
          )}
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: "0", marginBottom: "1.75rem",
        background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: "0.3rem",
        border: "1px solid var(--border)", width: "fit-content",
        flexWrap: "wrap",
      }}>
        {/* Browse group */}
        {BROWSE_TABS.map(t => (
          <TabButton key={t.id} id={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </TabButton>
        ))}

        {/* Separator */}
        <div style={{ width: 1, background: "var(--border)", margin: "0.25rem 0.2rem" }} />

        {/* Add liquidity group */}
        {ADD_TABS.map(t => (
          <TabButton key={t.id} id={t.id} active={tab === t.id} onClick={() => setTab(t.id)} badge={t.badge} badgeColor={t.badgeColor}>
            {t.icon}{t.label}
          </TabButton>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {tab === "pools"      && <PoolList />}
      {tab === "v2-add"    && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <AddLiquidity />
        </div>
      )}
      {tab === "v2-remove" && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <RemoveLiquidity />
        </div>
      )}
      {tab === "v3"        && <V3PositionManager />}
      {tab === "v4"        && <V4PositionManager />}

      {/* ── Back to pools hint ─────────────────────────────────── */}
      {isAddMode && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "1.25rem" }}>
          <button
            onClick={() => setTab("pools")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            ← Back to all pools
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared tab button ────────────────────────────────────────────────────────

function TabButton({ id, active, onClick, badge, badgeColor, children }: {
  id: Tab; active: boolean; onClick: () => void;
  badge?: string; badgeColor?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      key={id}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.35rem",
        padding: "0.45rem 0.9rem",
        borderRadius: 10, border: "none", cursor: "pointer",
        fontWeight: 600, fontSize: 13,
        background: active ? "var(--bg-card2, rgba(255,255,255,0.07))" : "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        boxShadow: active ? "inset 0 0 0 1px var(--border)" : "none",
        transition: "all 0.13s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.04em",
          background: active ? `${badgeColor}22` : "transparent",
          color: badgeColor ?? "var(--text-muted)",
          border: `1px solid ${active ? badgeColor : "var(--border)"}`,
          borderRadius: 4, padding: "1px 5px",
          transition: "all 0.13s",
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}
