import { useState } from "react";
import { Settings } from "lucide-react";

const PRESETS = [0.1, 0.5, 1.0];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function SlippageSettings({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const isHighSlippage = value > 5;
  const isFrontrunnable = value > 1;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "0.25rem 0.5rem", borderRadius: 8 }}
        title="Slippage settings"
      >
        <Settings size={14} />
        <span>{value}%</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem", width: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: "0.75rem" }}>Slippage Tolerance</div>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { onChange(p); setCustom(""); }}
                  style={{
                    flex: 1, padding: "0.4rem", borderRadius: 8, border: "1px solid",
                    borderColor: value === p ? "var(--accent)" : "var(--border)",
                    background: value === p ? "rgba(0,200,150,0.15)" : "transparent",
                    color: value === p ? "var(--text)" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}
                >{p}%</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="number"
                placeholder="Custom"
                value={custom}
                min={0.01}
                max={50}
                step={0.1}
                onChange={e => {
                  setCustom(e.target.value);
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) onChange(v);
                }}
                style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.4rem 0.6rem", color: "var(--text)", fontSize: 13, outline: "none" }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>%</span>
            </div>
            {isHighSlippage && (
              <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#f97316", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                ⚠ Very high slippage — you may lose funds
              </div>
            )}
            {!isHighSlippage && isFrontrunnable && (
              <div style={{ marginTop: "0.5rem", fontSize: 12, color: "#eab308" }}>
                Your transaction may be frontrun
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
