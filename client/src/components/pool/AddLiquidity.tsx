import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { useAddLiquidity } from "../../hooks/useLiquidity";
import TokenSelector from "../swap/TokenSelector";
import type { Token } from "../../lib/tokens";

type SelectorTarget = "a" | "b" | null;

export default function AddLiquidity() {
  const liq = useAddLiquidity();
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);

  const hasPosition = liq.pairAddress && liq.pairAddress !== "0x0000000000000000000000000000000000000000";
  const ready = liq.tokenA && liq.tokenB && liq.amountA && liq.amountB;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: "1.25rem" }}>Add Liquidity</h3>

        {hasPosition && (
          <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: 12, color: "#4ade80", marginBottom: "1rem" }}>
            You have an existing position in this pool
          </div>
        )}

        {/* Token A */}
        <LiqInput
          label="Token A"
          token={liq.tokenA}
          amount={liq.amountA}
          onChange={liq.setAmountA}
          onTokenClick={() => setSelectorTarget("a")}
        />

        <div style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0" }}>
          <Plus size={18} color="var(--text-muted)" />
        </div>

        {/* Token B */}
        <LiqInput
          label="Token B"
          token={liq.tokenB}
          amount={liq.amountB}
          onChange={liq.setAmountB}
          onTokenClick={() => setSelectorTarget("b")}
        />

        {liq.error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "0.6rem", fontSize: 13, color: "#f87171", marginTop: "0.75rem" }}>{liq.error}</div>
        )}

        {liq.txHash && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "0.6rem", fontSize: 13, color: "#4ade80", marginTop: "0.75rem" }}>
            <CheckCircle2 size={15} /> Liquidity added!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          {liq.needsApproveA && (
            <button onClick={liq.approveA} style={btnStyle}>Approve {liq.tokenA?.symbol}</button>
          )}
          {liq.needsApproveB && (
            <button onClick={liq.approveB} style={btnStyle}>Approve {liq.tokenB?.symbol}</button>
          )}
          <button
            onClick={liq.addLiquidity}
            disabled={!ready || liq.needsApproveA || liq.needsApproveB || liq.isPending}
            style={{ ...btnStyle, opacity: (!ready || liq.isPending) ? 0.6 : 1, cursor: (!ready) ? "not-allowed" : "pointer" }}
          >
            {liq.isPending ? "Confirming..." : !liq.tokenA || !liq.tokenB ? "Select tokens" : !liq.amountA || !liq.amountB ? "Enter amounts" : "Add Liquidity"}
          </button>
        </div>
      </div>

      {selectorTarget && (
        <TokenSelector
          onSelect={(t: Token) => {
            if (selectorTarget === "a") liq.setTokenA(t);
            else liq.setTokenB(t);
          }}
          exclude={selectorTarget === "a" ? liq.tokenB : liq.tokenA}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  );
}

function LiqInput({ label, token, amount, onChange, onTokenClick }: {
  label: string; token: Token | null; amount: string; onChange: (v: string) => void; onTokenClick: () => void;
}) {
  return (
    <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem" }}>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 22, fontWeight: 600, color: "var(--text)" }}
        />
        <button
          onClick={onTokenClick}
          style={{ background: token ? "rgba(255,255,255,0.06)" : "var(--accent)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.45rem 0.75rem", cursor: "pointer", color: "var(--text)", fontWeight: 600, fontSize: 14 }}
        >
          {token ? token.symbol : "Select ▾"}
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "0.85rem", borderRadius: 14, border: "none",
  background: "linear-gradient(135deg, var(--accent), #009e78)",
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
};
