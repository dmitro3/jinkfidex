import { Minus, Plus } from "lucide-react";

interface Props {
  currentPrice: number;
  minPrice: string;
  maxPrice: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  token0Symbol: string;
  token1Symbol: string;
}

export default function V3RangeSelector({ currentPrice, minPrice, maxPrice, onMinChange, onMaxChange, token0Symbol, token1Symbol }: Props) {
  const minNum = parseFloat(minPrice) || 0;
  const maxNum = maxPrice === "∞" ? Infinity : (parseFloat(maxPrice) || Infinity);
  const inRange = minNum <= currentPrice && currentPrice <= maxNum;

  const step = currentPrice * 0.01; // 1% steps

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Price Range</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: inRange ? "var(--neon)" : "#f97316", display: "inline-block", boxShadow: inRange ? "0 0 6px var(--neon-glow)" : "none" }} />
          <span style={{ color: inRange ? "var(--neon)" : "#f97316" }}>{inRange ? "In Range" : "Out of Range"}</span>
        </div>
      </div>

      {/* Current price */}
      <div style={{ textAlign: "center", padding: "0.6rem", background: "rgba(0,0,0,0.2)", borderRadius: 10, marginBottom: "0.75rem", fontSize: 12 }}>
        <span style={{ color: "var(--text-muted)" }}>Current: </span>
        <span style={{ fontWeight: 700 }}>{currentPrice.toFixed(6)}</span>
        <span style={{ color: "var(--text-muted)" }}> {token1Symbol}/{token0Symbol}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <PriceInput label="Min Price" value={minPrice} onChange={onMinChange} step={step} token0={token0Symbol} token1={token1Symbol} />
        <PriceInput label="Max Price" value={maxPrice} onChange={onMaxChange} step={step} token0={token0Symbol} token1={token1Symbol} />
      </div>

      {/* Quick range presets */}
      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.65rem" }}>
        {[
          { label: "±5%",  min: currentPrice * 0.95, max: currentPrice * 1.05 },
          { label: "±10%", min: currentPrice * 0.90, max: currentPrice * 1.10 },
          { label: "±20%", min: currentPrice * 0.80, max: currentPrice * 1.20 },
          { label: "Full", min: 0, max: 999999999 },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => { onMinChange(preset.min.toFixed(6)); onMaxChange(preset.max === 999999999 ? "∞" : preset.max.toFixed(6)); }}
            style={{ flex: 1, padding: "0.3rem", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
          >{preset.label}</button>
        ))}
      </div>
    </div>
  );
}

function PriceInput({ label, value, onChange, step, token0, token1 }: {
  label: string; value: string; onChange: (v: string) => void; step: number; token0: string; token1: string;
}) {
  const isInfinity = value === "∞";
  const num = isInfinity ? Infinity : (parseFloat(value) || 0);
  const handleDecrement = () => {
    if (isInfinity) return;
    onChange((Math.max(0, num - step)).toFixed(6));
  };
  const handleIncrement = () => {
    if (isInfinity) return;
    onChange((num + step).toFixed(6));
  };
  return (
    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <button onClick={handleDecrement} disabled={isInfinity} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: isInfinity ? "not-allowed" : "pointer", color: "var(--text-muted)", flexShrink: 0, opacity: isInfinity ? 0.4 : 1 }}>
          <Minus size={11} />
        </button>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontWeight: 700, fontSize: 14, textAlign: "center", minWidth: 0 }}
        />
        <button onClick={handleIncrement} disabled={isInfinity} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: isInfinity ? "not-allowed" : "pointer", color: "var(--text-muted)", flexShrink: 0, opacity: isInfinity ? 0.4 : 1 }}>
          <Plus size={11} />
        </button>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.3rem", textAlign: "center" }}>{token1}/{token0}</div>
    </div>
  );
}
