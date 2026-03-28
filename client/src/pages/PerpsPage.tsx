import { useEffect, useMemo } from "react";
import { usePerps } from "../hooks/usePerps";
import PriceChart from "../components/perps/PriceChart";
import OrderPanel from "../components/perps/OrderPanel";
import PositionList from "../components/perps/PositionList";
import { PERP_MARKETS, MARKET_FEED_KEY, fmtUSD } from "../lib/perps";
import { useFeed } from "../context/PriceFeedContext";

export default function PerpsPage() {
  const perps = usePerps();
  const feed  = useFeed();

  // Overlay live Binance prices onto static market data
  const liveMarkets = useMemo(() => PERP_MARKETS.map(m => {
    const key  = MARKET_FEED_KEY[m.symbol];
    const live = key ? feed[key] : undefined;
    if (!live) return m;
    return { ...m, markPrice: live.price, indexPrice: live.price };
  }), [feed]);

  const liveSelected = liveMarkets.find(m => m.symbol === perps.selectedMarket.symbol)
    ?? perps.selectedMarket;

  // Keep usePerps selectedMarket in sync with live prices
  useEffect(() => {
    perps.setSelectedMarket(liveSelected);
  }, [liveSelected.markPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh position PnL with live prices every 5s
  useEffect(() => {
    const livePrices = Object.fromEntries(
      PERP_MARKETS.map(m => {
        const key = MARKET_FEED_KEY[m.symbol];
        return [m.symbol, key && feed[key] ? feed[key]!.price : m.markPrice];
      })
    );
    const id = setInterval(() => perps.refreshPrices(livePrices), 5000);
    return () => clearInterval(id);
  }, [feed]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPnl = perps.positions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalSize = perps.positions.reduce((s, p) => s + p.sizeUSD, 0);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26, marginBottom: "0.2rem" }}>Perpetuals</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Trade with up to 100x leverage · Powered by on-chain oracles</p>
        </div>

        {/* Portfolio summary */}
        {perps.positions.length > 0 && (
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {[
              { label: "Open Positions", value: perps.positions.length.toString() },
              { label: "Total Size",     value: fmtUSD(totalSize) },
              { label: "Unrealized PnL", value: `${totalPnl >= 0 ? "+" : ""}${fmtUSD(totalPnl)}`, color: totalPnl >= 0 ? "var(--neon)" : "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: s.color ?? "var(--text)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market stats bar */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "1.25rem", paddingBottom: "0.25rem" }}>
        {liveMarkets.map(m => {
          const key     = MARKET_FEED_KEY[m.symbol];
          const liveTick = key ? feed[key] : undefined;
          const pct = liveTick?.changePct24h;
          const selected = perps.selectedMarket.symbol === m.symbol;
          return (
            <button
              key={m.symbol}
              onClick={() => perps.setSelectedMarket(m)}
              style={{ flexShrink: 0, padding: "0.5rem 0.85rem", borderRadius: 10, border: "1px solid", borderColor: selected ? "var(--accent)" : "var(--border)", background: selected ? "rgba(0,200,150,0.12)" : "rgba(11,21,39,0.7)", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: selected ? "var(--text)" : "var(--text-muted)" }}>{m.symbol}</div>
              <div style={{ fontSize: 12, display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span style={{ color: selected ? "var(--accent)" : "var(--text-muted)" }}>
                  ${m.markPrice.toLocaleString(undefined, { maximumFractionDigits: m.markPrice < 10 ? 4 : 2 })}
                </span>
                {pct !== undefined && (
                  <span style={{ color: pct >= 0 ? "var(--neon)" : "#f87171", fontSize: 10, fontWeight: 700 }}>
                    {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main layout: chart + order panel */}
      <div className="perps-grid">
        <PriceChart market={liveSelected} />
        <OrderPanel perps={perps} />
      </div>

      {/* Positions / Orders tabs */}
      <div style={{ background: "rgba(11,21,39,0.85)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Positions", count: perps.positions.length },
            { label: "Orders",    count: perps.orders.length },
          ].map((t, i) => (
            <div key={t.label} style={{ padding: "0.75rem 1.25rem", fontWeight: 600, fontSize: 14, color: i === 0 ? "var(--text)" : "var(--text-muted)", borderBottom: i === 0 ? "2px solid var(--accent)" : "2px solid transparent", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.count}</span>
              )}
            </div>
          ))}
        </div>
        <PositionList positions={perps.positions} onClose={perps.closePosition} />
      </div>

      {/* Info strip */}
      <div className="info-grid-4">
        {[
          { label: "Long OI",    value: fmtUSD(perps.selectedMarket.openInterestLong),  color: "#4ade80" },
          { label: "Short OI",   value: fmtUSD(perps.selectedMarket.openInterestShort), color: "#f87171" },
          { label: "Avail. Liq (Long)",  value: fmtUSD(perps.selectedMarket.availableLiquidityLong) },
          { label: "Avail. Liq (Short)", value: fmtUSD(perps.selectedMarket.availableLiquidityShort) },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(11,21,39,0.7)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.75rem 1rem" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: s.color ?? "var(--text)", marginTop: "0.2rem" }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
