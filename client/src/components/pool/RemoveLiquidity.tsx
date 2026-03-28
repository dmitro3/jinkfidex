import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatUnits } from "viem";
import { useChainId, useReadContract } from "wagmi";
import { useRemoveLiquidity } from "../../hooks/useLiquidity";
import TokenSelector from "../swap/TokenSelector";
import type { Token } from "../../lib/tokens";
import { FACTORY_ABI, CONTRACT_ADDRESSES } from "../../lib/contracts";
import { ETH_ADDRESS } from "../../lib/tokens";

const PERCENTS = [25, 50, 75, 100];
type SelectorTarget = "a" | "b" | null;

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export default function RemoveLiquidity() {
  const chainId = useChainId();
  const addrs = CONTRACT_ADDRESSES[chainId] ?? CONTRACT_ADDRESSES[1];

  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);

  // Resolve ETH → WETH for factory lookup
  const resolvedA = tokenA?.address === ETH_ADDRESS ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" : tokenA?.address;
  const resolvedB = tokenB?.address === ETH_ADDRESS ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" : tokenB?.address;

  // Derive pair address from factory
  const { data: pairAddress } = useReadContract({
    address: addrs.factory,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: resolvedA && resolvedB
      ? [resolvedA as `0x${string}`, resolvedB as `0x${string}`]
      : undefined,
    query: { enabled: !!resolvedA && !!resolvedB },
  });

  const validPair = pairAddress && pairAddress !== ZERO_ADDR
    ? (pairAddress as `0x${string}`)
    : undefined;

  const rl = useRemoveLiquidity(validPair, tokenA, tokenB);

  const formattedLp = rl.lpBalance
    ? parseFloat(formatUnits(rl.lpBalance as bigint, 18)).toFixed(6)
    : "0.000000";

  const pairExists = !!validPair;
  const bothSelected = !!tokenA && !!tokenB;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div style={{ background: "rgba(11,21,39,0.85)", border: "1px solid var(--border)", borderRadius: 20, padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: "1.25rem" }}>Remove Liquidity</h3>

        {/* Token selection */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            { label: "Token A", token: tokenA, target: "a" as SelectorTarget },
            { label: "Token B", token: tokenB, target: "b" as SelectorTarget },
          ].map(({ label, token, target }) => (
            <button
              key={label}
              onClick={() => setSelectorTarget(target)}
              style={{ flex: 1, padding: "0.75rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", color: token ? "var(--text)" : "var(--text-muted)", fontWeight: token ? 600 : 400, fontSize: 14 }}
            >
              {token ? token.symbol : label + " ▾"}
            </button>
          ))}
        </div>

        {/* Pair status */}
        {bothSelected && !pairExists && pairAddress !== undefined && (
          <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "0.6rem 0.85rem", fontSize: 13, color: "#f97316", marginBottom: "1rem" }}>
            No V2 pool exists for this pair
          </div>
        )}
        {bothSelected && pairExists && (
          <div style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10, padding: "0.5rem 0.85rem", fontSize: 12, color: "var(--neon)", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
            <span>Pool found</span>
            <span style={{ fontFamily: "monospace" }}>{validPair!.slice(0, 8)}…{validPair!.slice(-6)}</span>
          </div>
        )}

        {/* Amount slider */}
        <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Remove Amount</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>LP Balance: {formattedLp}</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: "1rem" }}>{rl.percent}%</div>
          <input
            type="range" min={1} max={100} value={rl.percent}
            onChange={e => rl.setPercent(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
            {PERCENTS.map(p => (
              <button
                key={p}
                onClick={() => rl.setPercent(p)}
                style={{ flex: 1, padding: "0.35rem", borderRadius: 8, border: "1px solid", borderColor: rl.percent === p ? "var(--accent)" : "var(--border)", background: rl.percent === p ? "rgba(0,200,150,0.15)" : "transparent", color: rl.percent === p ? "var(--text)" : "var(--text-muted)", cursor: "pointer", fontSize: 13 }}
              >
                {p === 100 ? "MAX" : `${p}%`}
              </button>
            ))}
          </div>
        </div>

        {rl.error && (
          <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "0.6rem", fontSize: 13, color: "#f87171", marginBottom: "0.75rem" }}>{rl.error}</div>
        )}
        {rl.txHash && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 10, padding: "0.6rem", fontSize: 13, color: "var(--neon)", marginBottom: "0.75rem" }}>
            <CheckCircle2 size={15} /> Liquidity removed!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {rl.needsApprove && (
            <button onClick={rl.approve} style={btnStyle}>Approve LP Token</button>
          )}
          <button
            onClick={rl.removeLiquidity}
            disabled={!validPair || !bothSelected || rl.needsApprove || rl.isPending}
            style={{ ...btnStyle, opacity: (!validPair || !bothSelected) ? 0.5 : 1, cursor: (!validPair || !bothSelected) ? "not-allowed" : "pointer" }}
          >
            {rl.isPending ? "Confirming…"
              : !bothSelected ? "Select tokens"
              : !validPair ? "No pool found"
              : "Remove Liquidity"}
          </button>
        </div>
      </div>

      {selectorTarget && (
        <TokenSelector
          onSelect={(t: Token) => {
            if (selectorTarget === "a") setTokenA(t);
            else setTokenB(t);
          }}
          exclude={selectorTarget === "a" ? tokenB : tokenA}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "0.85rem", borderRadius: 14, border: "none",
  background: "linear-gradient(135deg, var(--accent), #009e78)",
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
};
