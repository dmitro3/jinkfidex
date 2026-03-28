import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { PERP_MARKETS, fmtUSD } from "../../lib/perps";
import { usePerps } from "../../hooks/usePerps";

interface Props {
  perps: ReturnType<typeof usePerps>;
}

const ORDER_TYPES = [
  { id: "market", label: "Market" },
  { id: "limit",  label: "Limit" },
  { id: "stop",   label: "Stop" },
] as const;

export default function OrderPanel({ perps }: Props) {
  const {
    selectedMarket, side, collateral, leverage, orderType, limitPrice,
    sizeUSD, liqPrice, isSubmitting, error,
    setSide, setCollateral, setLeverage, setOrderType, setLimitPrice,
    setSelectedMarket, openPosition,
  } = perps;

  const collateralNum = parseFloat(collateral) || 0;
  const fees = sizeUSD * 0.0006; // 0.06% taker fee

  return (
    <div style={{ background: "rgba(11,21,39,0.85)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      {/* Market selector */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.1rem" }}>
          {PERP_MARKETS.map(m => (
            <button
              key={m.symbol}
              onClick={() => setSelectedMarket(m)}
              style={{ flexShrink: 0, padding: "0.3rem 0.75rem", borderRadius: 8, border: "1px solid", borderColor: selectedMarket.symbol === m.symbol ? "var(--accent)" : "var(--border)", background: selectedMarket.symbol === m.symbol ? "rgba(0,200,150,0.15)" : "transparent", color: selectedMarket.symbol === m.symbol ? "var(--text)" : "var(--text-muted)", cursor: "pointer", fontSize: 12, fontWeight: 700, boxShadow: selectedMarket.symbol === m.symbol ? "0 0 8px var(--accent-glow)" : "none" }}
            >
              {m.symbol}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "1rem" }}>
        {/* Long / Short toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setSide("long")}
            style={{ padding: "0.65rem", borderRadius: 10, border: "1px solid", borderColor: side === "long" ? "rgba(74,222,128,0.5)" : "var(--border)", background: side === "long" ? "rgba(74,222,128,0.1)" : "transparent", color: side === "long" ? "#4ade80" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", boxShadow: side === "long" ? "0 0 10px rgba(74,222,128,0.15)" : "none" }}
          >
            <TrendingUp size={15} /> Long
          </button>
          <button
            onClick={() => setSide("short")}
            style={{ padding: "0.65rem", borderRadius: 10, border: "1px solid", borderColor: side === "short" ? "rgba(248,113,113,0.5)" : "var(--border)", background: side === "short" ? "rgba(248,113,113,0.1)" : "transparent", color: side === "short" ? "#f87171" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", boxShadow: side === "short" ? "0 0 10px rgba(248,113,113,0.15)" : "none" }}
          >
            <TrendingDown size={15} /> Short
          </button>
        </div>

        {/* Order type */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "0.2rem" }}>
          {ORDER_TYPES.map(ot => (
            <button
              key={ot.id}
              onClick={() => setOrderType(ot.id)}
              style={{ flex: 1, padding: "0.3rem", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: orderType === ot.id ? "var(--bg-card)" : "transparent", color: orderType === ot.id ? "var(--text)" : "var(--text-muted)" }}
            >{ot.label}</button>
          ))}
        </div>

        {/* Collateral input */}
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Collateral (USDC)</label>
          <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.6rem 0.85rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 16, marginRight: "0.4rem" }}>$</span>
            <input
              type="number" placeholder="0.00" value={collateral} onChange={e => setCollateral(e.target.value)}
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 16, fontWeight: 700 }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>USDC</span>
          </div>
        </div>

        {/* Limit / Stop price */}
        {(orderType === "limit" || orderType === "stop") && (
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {orderType === "limit" ? "Limit Price" : "Stop Price"}
            </label>
            <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.6rem 0.85rem" }}>
              <span style={{ color: "var(--text-muted)", fontSize: 16, marginRight: "0.4rem" }}>$</span>
              <input
                type="number" placeholder={selectedMarket.markPrice.toString()} value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 16, fontWeight: 700 }}
              />
            </div>
          </div>
        )}

        {/* Leverage slider */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Leverage</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: leverage >= 50 ? "#f87171" : leverage >= 20 ? "#f97316" : "var(--neon)" }}>{leverage}x</span>
          </div>
          <input
            type="range" min={1} max={selectedMarket.maxLeverage} value={leverage} onChange={e => setLeverage(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {[1, 5, 10, 25, 50, selectedMarket.maxLeverage].filter((v, i, a) => a.indexOf(v) === i).map(v => (
              <button key={v} onClick={() => setLeverage(v)} style={{ background: "none", border: "none", cursor: "pointer", color: leverage === v ? "var(--accent)" : "var(--text-muted)", fontWeight: leverage === v ? 700 : 400 }}>{v}x</button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        {collateralNum > 0 && (
          <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.75rem", marginBottom: "0.85rem", fontSize: 12 }}>
            {[
              { label: "Position Size", value: fmtUSD(sizeUSD) },
              { label: "Entry Price",   value: `$${selectedMarket.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
              { label: "Liq. Price",    value: `$${liqPrice.toFixed(2)}`, color: "#f87171" },
              { label: "Fees",          value: fmtUSD(fees), color: "var(--text-muted)" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                <span style={{ fontWeight: 600, color: row.color ?? "var(--text)" }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {leverage >= 50 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 12, color: "#f97316", marginBottom: "0.75rem", padding: "0.5rem 0.7rem", background: "rgba(249,115,22,0.08)", borderRadius: 8, border: "1px solid rgba(249,115,22,0.2)" }}>
            <AlertTriangle size={12} /> High leverage increases liquidation risk
          </div>
        )}

        {error && (
          <div style={{ fontSize: 13, color: "#f87171", marginBottom: "0.6rem", padding: "0.5rem 0.7rem", background: "rgba(248,113,113,0.08)", borderRadius: 8 }}>{error}</div>
        )}

        <button
          onClick={openPosition}
          disabled={isSubmitting || !collateral}
          style={{ width: "100%", padding: "0.85rem", borderRadius: 12, border: "none", fontWeight: 800, fontSize: 15, cursor: collateral ? "pointer" : "not-allowed", opacity: isSubmitting ? 0.7 : 1, transition: "all 0.2s", background: !collateral ? "rgba(58,77,102,0.35)" : side === "long" ? "linear-gradient(135deg, #16a34a, #4ade80)" : "linear-gradient(135deg, #b91c1c, #f87171)", color: collateral ? "#fff" : "var(--text-muted)", boxShadow: !collateral ? "none" : side === "long" ? "0 4px 16px rgba(74,222,128,0.25)" : "0 4px 16px rgba(248,113,113,0.25)" }}
        >
          {isSubmitting ? "Opening…" : !collateral ? "Enter Collateral" : `${side === "long" ? "Long" : "Short"} ${selectedMarket.symbol} ${leverage}x`}
        </button>
      </div>
    </div>
  );
}
