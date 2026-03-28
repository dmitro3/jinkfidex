import { useState } from "react";
import { X } from "lucide-react";
import { formatUnits } from "viem";
import { useFarm } from "../../hooks/useFarm";
import type { FarmInfo } from "../../lib/farms";

interface Props {
  farm: FarmInfo;
  onClose: () => void;
}

type Tab = "stake" | "unstake";

export default function StakeModal({ farm, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("stake");
  const f = useFarm(farm);

  const lpFormatted = formatUnits(f.lpBalance, 18);
  const stakedFormatted = formatUnits(f.stakedAmount, 18);
  const [unstakeAmount, setUnstakeAmount] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, width: 400, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{farm.name}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["stake", "unstake"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: "0.75rem", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, color: tab === t ? "var(--text)" : "var(--text-muted)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent" }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {tab === "stake" ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Available LP: {parseFloat(lpFormatted).toFixed(6)} {farm.name}
              </div>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="number"
                  placeholder="0.0"
                  value={f.stakeAmount}
                  onChange={e => f.setStakeAmount(e.target.value)}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 18, fontWeight: 600 }}
                />
                <button onClick={() => f.setStakeAmount(lpFormatted)} style={{ background: "rgba(0,200,150,0.2)", border: "none", color: "var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>MAX</button>
              </div>

              {f.error && <div style={{ fontSize: 13, color: "#f87171", marginBottom: "0.75rem" }}>{f.error}</div>}

              {f.needsApprove ? (
                <button onClick={f.approve} style={btnStyle}>Approve LP Token</button>
              ) : (
                <button onClick={f.stake} disabled={f.isPending || !f.stakeAmount} style={{ ...btnStyle, opacity: (!f.stakeAmount || f.isPending) ? 0.6 : 1 }}>
                  {f.isPending ? "Staking..." : "Stake"}
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Staked: {parseFloat(stakedFormatted).toFixed(6)} {farm.name}
              </div>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={e => setUnstakeAmount(e.target.value)}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 18, fontWeight: 600 }}
                />
                <button onClick={() => setUnstakeAmount(stakedFormatted)} style={{ background: "rgba(0,200,150,0.2)", border: "none", color: "var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>MAX</button>
              </div>

              <button
                onClick={() => { try { const v = BigInt(Math.floor(parseFloat(unstakeAmount) * 1e18)); f.unstake(v); } catch {} }}
                disabled={f.isPending || !unstakeAmount}
                style={{ ...btnStyle, opacity: (!unstakeAmount || f.isPending) ? 0.6 : 1 }}
              >
                {f.isPending ? "Unstaking..." : "Unstake"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, var(--accent), #009e78)",
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
};
