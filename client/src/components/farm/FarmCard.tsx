import { useState } from "react";
import { ChevronDown, ChevronUp, Flame, Sparkles } from "lucide-react";
import { formatUnits } from "viem";
import { useFarm } from "../../hooks/useFarm";
import StakeModal from "./StakeModal";
import type { FarmInfo } from "../../lib/farms";

interface Props {
  farm: FarmInfo;
}

export default function FarmCard({ farm }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const f = useFarm(farm);

  const pendingFormatted = parseFloat(formatUnits(f.pendingReward, 18)).toFixed(4);
  const stakedFormatted = parseFloat(formatUnits(f.stakedAmount, 18)).toFixed(4);
  const hasStake = f.stakedAmount > 0n;

  return (
    <>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,200,150,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        {/* Main row */}
        <div
          style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr auto", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", cursor: "pointer" }}
          onClick={() => setExpanded(o => !o)}
        >
          {/* Farm name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{farm.token0Symbol.slice(0, 2)}</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent),#009e78)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginLeft: -10 }}>{farm.token1Symbol.slice(0, 2)}</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{farm.name}</span>
                {farm.isHot && <span style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Flame size={10} />Hot</span>}
                {farm.isNew && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><Sparkles size={10} />New</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Earn {farm.rewardSymbol}</div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>APR</div>
            <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 15 }}>{farm.aprPercent.toFixed(1)}%</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>TVL</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>${(farm.tvlUSD / 1_000_000).toFixed(2)}M</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Multiplier</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--accent)" }}>{farm.multiplier}</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Earned</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{pendingFormatted}</div>
          </div>

          <div style={{ color: "var(--text-muted)" }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1.5rem", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.25rem" }}>Your Stake</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{stakedFormatted} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>LP</span></div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.25rem" }}>{farm.rewardSymbol} Earned</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{pendingFormatted}</div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {hasStake && (
                <button
                  onClick={e => { e.stopPropagation(); f.harvest(); }}
                  disabled={f.isPending || f.pendingReward === 0n}
                  style={{ padding: "0.55rem 1rem", borderRadius: 10, border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 14, opacity: f.pendingReward === 0n ? 0.4 : 1 }}
                >
                  Harvest
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); setStakeOpen(true); }}
                style={{ padding: "0.55rem 1.25rem", borderRadius: 10, border: "none", background: "linear-gradient(135deg, var(--accent), #009e78)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
              >
                {hasStake ? "Manage" : "Stake LP"}
              </button>
            </div>
          </div>
        )}
      </div>

      {stakeOpen && <StakeModal farm={farm} onClose={() => setStakeOpen(false)} />}
    </>
  );
}
