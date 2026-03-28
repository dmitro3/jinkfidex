import { useFeed } from "../../context/PriceFeedContext";

const STATIC = [
  { symbol: "BTC",   feedKey: "BTCUSDT",   fallbackPrice: "67,412.50", fallbackChange: "+2.4%" },
  { symbol: "ETH",   feedKey: "ETHUSDT",   fallbackPrice: "3,542.80",  fallbackChange: "+1.8%" },
  { symbol: "BNB",   feedKey: "BNBUSDT",   fallbackPrice: "592.30",    fallbackChange: "-0.5%" },
  { symbol: "SOL",   feedKey: "SOLUSDT",   fallbackPrice: "181.42",    fallbackChange: "+4.2%" },
  { symbol: "ARB",   feedKey: "ARBUSDT",   fallbackPrice: "1.24",      fallbackChange: "+3.1%" },
  { symbol: "MATIC", feedKey: "MATICUSDT", fallbackPrice: "0.892",     fallbackChange: "-1.2%" },
  { symbol: "LINK",  feedKey: "LINKUSDT",  fallbackPrice: "18.74",     fallbackChange: "+2.9%" },
  { symbol: "UNI",   feedKey: "UNIUSDT",   fallbackPrice: "11.52",     fallbackChange: "+0.7%" },
  { symbol: "AAVE",  feedKey: "AAVEUSDT",  fallbackPrice: "142.80",    fallbackChange: "+1.5%" },
  { symbol: "CRV",   feedKey: "CRVUSDT",   fallbackPrice: "0.548",     fallbackChange: "-0.8%" },
];

function fmt(price: number, symbol: string): string {
  const decimals = symbol === "BTC" ? 2 : price < 0.01 ? 5 : price < 1 ? 4 : price < 100 ? 3 : 2;
  return price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function Ticker() {
  const feed = useFeed();

  const tickers = STATIC.map(t => {
    const live = feed[t.feedKey];
    if (!live) return { symbol: t.symbol, price: t.fallbackPrice, change: t.fallbackChange, positive: t.fallbackChange.startsWith("+") };
    const pct = live.changePct24h;
    return { symbol: t.symbol, price: fmt(live.price, t.symbol), change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`, positive: pct >= 0 };
  });

  const all = [...tickers, ...tickers];

  return (
    <div style={{
      borderBottom: "1px solid var(--border)",
      background: "rgba(0,21,32,0.95)",
      overflow: "hidden",
      height: 30,
      display: "flex",
      alignItems: "center",
    }}>
      {/* Left fade */}
      <div style={{ position: "absolute", left: 220, width: 32, height: 30, background: "linear-gradient(90deg, rgba(0,21,32,1), transparent)", zIndex: 2, pointerEvents: "none" }} />
      {/* Right fade */}
      <div style={{ position: "absolute", right: 0, width: 32, height: 30, background: "linear-gradient(270deg, rgba(0,21,32,1), transparent)", zIndex: 2, pointerEvents: "none" }} />

      <div style={{
        display: "flex",
        gap: "2rem",
        animation: "ticker 38s linear infinite",
        whiteSpace: "nowrap",
        paddingLeft: "1rem",
        alignItems: "center",
      }}>
        {all.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
              color: "var(--text-muted)",
              fontFamily: "'Share Tech Mono', monospace",
            }}>{t.symbol}</span>
            <span style={{
              fontSize: 11, color: "var(--text)",
              fontFamily: "'Share Tech Mono', monospace",
            }}>${t.price}</span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: t.positive ? "var(--accent)" : "var(--punk)",
              fontFamily: "'Share Tech Mono', monospace",
            }}>{t.change}</span>
            <span style={{ color: "var(--border)", fontSize: 8 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
