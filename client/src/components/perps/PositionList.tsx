import { TrendingUp, TrendingDown, X } from "lucide-react";
import { fmtUSD, type Position } from "../../lib/perps";

interface Props {
  positions: Position[];
  onClose: (id: string) => void;
}

export default function PositionList({ positions, onClose }: Props) {
  if (!positions.length) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)", fontSize: 14 }}>
        No open positions
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Market", "Side", "Size", "Collateral", "Leverage", "Entry", "Mark", "Liq.", "PnL", ""].map(h => (
              <th key={h} style={{ padding: "0.6rem 0.85rem", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map(pos => {
            const isProfit = pos.unrealizedPnl >= 0;
            return (
              <tr key={pos.id} style={{ borderBottom: "1px solid rgba(22,36,64,0.5)" }}>
                <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700 }}>{pos.market}</td>
                <td style={{ padding: "0.75rem 0.85rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.55rem", borderRadius: 6, fontSize: 12, fontWeight: 700, background: pos.side === "long" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: pos.side === "long" ? "#4ade80" : "#f87171" }}>
                    {pos.side === "long" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {pos.side.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.85rem", fontWeight: 600 }}>{fmtUSD(pos.sizeUSD)}</td>
                <td style={{ padding: "0.75rem 0.85rem" }}>{fmtUSD(pos.collateralUSD)}</td>
                <td style={{ padding: "0.75rem 0.85rem", color: pos.leverage >= 20 ? "#f97316" : "var(--text)" }}>{pos.leverage}x</td>
                <td style={{ padding: "0.75rem 0.85rem" }}>${pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td style={{ padding: "0.75rem 0.85rem" }}>${pos.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                <td style={{ padding: "0.75rem 0.85rem", color: "#f87171" }}>${pos.liquidationPrice.toFixed(2)}</td>
                <td style={{ padding: "0.75rem 0.85rem" }}>
                  <div style={{ fontWeight: 700, color: isProfit ? "var(--neon)" : "#f87171" }}>
                    {isProfit ? "+" : ""}{fmtUSD(pos.unrealizedPnl)}
                  </div>
                  <div style={{ fontSize: 11, color: isProfit ? "rgba(0,229,160,0.7)" : "rgba(248,113,113,0.7)" }}>
                    {isProfit ? "+" : ""}{pos.unrealizedPnlPct.toFixed(2)}%
                  </div>
                </td>
                <td style={{ padding: "0.75rem 0.85rem" }}>
                  <button
                    onClick={() => onClose(pos.id)}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: 7, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    <X size={11} /> Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
