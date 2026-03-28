import { V3_FEE_TIERS, type V3FeeTier } from "../../lib/uniswap";

interface Props {
  value: V3FeeTier;
  onChange: (fee: V3FeeTier) => void;
}

export default function FeeTierSelector({ value, onChange }: Props) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fee Tier</div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        {V3_FEE_TIERS.map(tier => (
          <button
            key={tier.fee}
            onClick={() => onChange(tier.fee)}
            style={{
              flex: 1, padding: "0.4rem 0.25rem",
              borderRadius: 8,
              border: "1px solid",
              borderColor: value === tier.fee ? "var(--accent)" : "var(--border)",
              background: value === tier.fee ? "rgba(0,200,150,0.15)" : "transparent",
              color: value === tier.fee ? "var(--text)" : "var(--text-muted)",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              boxShadow: value === tier.fee ? "0 0 8px var(--accent-glow)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </div>
  );
}
