export type SwapVersion = "v2" | "v3" | "v4";

const VERSIONS: { id: SwapVersion; label: string; badge?: string; desc: string }[] = [
  { id: "v2", label: "V2",    desc: "Classic AMM · x·y=k" },
  { id: "v3", label: "V3",    desc: "Concentrated liquidity" },
  { id: "v4", label: "V4",    badge: "New", desc: "Hooks · Singleton" },
];

interface Props {
  value: SwapVersion;
  onChange: (v: SwapVersion) => void;
}

export default function VersionSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "0.2rem", border: "1px solid var(--border)" }}>
      {VERSIONS.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          title={v.desc}
          style={{
            padding: "0.3rem 0.7rem",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.03em",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            background: value === v.id ? "var(--accent)" : "transparent",
            color: value === v.id ? "#fff" : "var(--text-muted)",
            boxShadow: value === v.id ? "0 0 10px var(--accent-glow)" : "none",
            transition: "all 0.15s",
          }}
        >
          {v.label}
          {v.badge && (
            <span style={{ background: "rgba(0,229,160,0.2)", color: "var(--neon)", borderRadius: 4, padding: "0 4px", fontSize: 9, fontWeight: 800 }}>
              {v.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
