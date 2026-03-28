import { useState } from "react";
import { ChevronDown, Puzzle } from "lucide-react";
import { V4_HOOKS } from "../../lib/uniswap";

interface Props {
  value: string; // hook address
  onChange: (addr: string) => void;
}

export default function HookSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = V4_HOOKS.find(h => h.address === value) ?? V4_HOOKS[0];

  return (
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Hook
      </div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.5rem 0.75rem", background: "rgba(0,229,160,0.05)",
          border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10,
          color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Puzzle size={13} color="var(--neon)" />
          {selected.name}
        </div>
        <ChevronDown size={13} color="var(--text-muted)" />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {V4_HOOKS.map(hook => (
              <button
                key={hook.address}
                onClick={() => { onChange(hook.address); setOpen(false); }}
                style={{
                  width: "100%", padding: "0.65rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.15rem",
                  border: "none", background: hook.address === value ? "rgba(0,229,160,0.06)" : "transparent",
                  color: "var(--text)", cursor: "pointer", textAlign: "left",
                  borderLeft: hook.address === value ? "2px solid var(--neon)" : "2px solid transparent",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13 }}>{hook.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hook.description}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
