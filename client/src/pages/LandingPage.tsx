import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight, Droplets, TrendingUp, Coins, Layers,
  Lock, Trophy, ArrowRightLeft, Zap, Shield, Users, Activity,
  BarChart2, ChevronRight,
} from "lucide-react";
import { createChart, LineSeries, ColorType } from "lightweight-charts";
import { useFeed } from "../context/PriceFeedContext";
import { useUniswapPools } from "../hooks/useUniswapPools";

// ── Sparkline using lightweight-charts ────────────────────────────────────────

interface SparkProps { symbol: string; color: string; height?: number }

function Sparkline({ symbol, color, height = 56 }: SparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor:  "transparent",
      },
      grid:        { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair:   { vertLine: { visible: false }, horzLine: { visible: false } },
      rightPriceScale: { visible: false },
      timeScale:       { visible: false },
      handleScroll:    false,
      handleScale:     false,
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Generate synthetic 30-day price data anchored to realistic base
    const bases: Record<string, number> = {
      BTCUSDT: 67000, ETHUSDT: 3500, SOLUSDT: 165,
      BNBUSDT: 580,   LINKUSDT: 18,
    };
    const base = bases[symbol] ?? 100;
    const now  = Math.floor(Date.now() / 1000);
    const DAY  = 86400;
    const data = Array.from({ length: 30 }, (_, i) => {
      const noise = (Math.sin(i * 1.3 + symbol.charCodeAt(0)) + Math.cos(i * 0.7)) * 0.04;
      const trend = (i / 29) * 0.1 - 0.05;
      return {
        time:  (now - (29 - i) * DAY) as unknown as import("lightweight-charts").UTCTimestamp,
        value: base * (1 + trend + noise),
      };
    });
    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, height);
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [symbol, color, height]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedStat({ value, label, prefix = "", suffix = "" }: {
  value: number; label: string; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1400;
    const start    = performance.now();
    const raf = (ts: number) => {
      const progress = Math.min((ts - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * ease));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value]);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 900, fontSize: 32, color: "var(--accent)",
        letterSpacing: "0.04em",
        textShadow: "0 0 20px var(--accent-glow)",
        lineHeight: 1.1,
      }}>
        {prefix}{display.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

// ── Price ticker row ──────────────────────────────────────────────────────────

const TICKER_SYMBOLS = [
  { key: "BTCUSDT", label: "BTC" },
  { key: "ETHUSDT", label: "ETH" },
  { key: "SOLUSDT", label: "SOL" },
  { key: "BNBUSDT", label: "BNB" },
  { key: "LINKUSDT", label: "LINK" },
];

function PriceTicker() {
  const feed = useFeed();
  return (
    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
      {TICKER_SYMBOLS.map(({ key, label }) => {
        const d = feed[key];
        const change = d?.changePct24h ?? 0;
        const isUp   = change >= 0;
        return (
          <div key={key} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            padding: "0.5rem 0.9rem",
            minWidth: 130,
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{label}/USDT</div>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", color: "var(--text)" }}>
                ${d ? d.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
              </div>
            </div>
            <div style={{
              marginLeft: "auto", fontSize: 10, fontWeight: 700,
              fontFamily: "'Share Tech Mono', monospace",
              color: isUp ? "var(--neon, #00e5a0)" : "#f87171",
            }}>
              {isUp ? "+" : ""}{change.toFixed(2)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TVL / Volume chart (lightweight-charts area) ──────────────────────────────

function TvlChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 200,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor:  "rgba(180,180,180,0.7)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true },
      handleScroll: false, handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: "rgba(212,175,55,0.9)",
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    const now = Math.floor(Date.now() / 1000);
    const DAY = 86400;
    // Synthetic TVL growth data (60 days)
    const data = Array.from({ length: 60 }, (_, i) => {
      const base   = 12_000_000;
      const growth = i * 280_000;
      const noise  = Math.sin(i * 0.8) * 400_000 + Math.cos(i * 0.3) * 200_000;
      return {
        time:  (now - (59 - i) * DAY) as unknown as import("lightweight-charts").UTCTimestamp,
        value: base + growth + noise,
      };
    });
    series.setData(data);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, 200);
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  return <div ref={containerRef} style={{ width: "100%" }} />;
}

// ── Pool stats mini bars ──────────────────────────────────────────────────────

function PoolStatsBar() {
  const { data: pools } = useUniswapPools(1);

  const top5 = (pools ?? []).slice(0, 5);
  const maxTvl = Math.max(...top5.map(p => p.tvlUSD), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {top5.map(pool => (
        <div key={pool.id}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'Share Tech Mono', monospace", color: "var(--text-muted)", marginBottom: 3 }}>
            <span style={{ color: "var(--text)" }}>{pool.token0Symbol}/{pool.token1Symbol}</span>
            <span>${(pool.tvlUSD / 1_000_000).toFixed(1)}M TVL · {pool.apr.toFixed(1)}% APR</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(pool.tvlUSD / maxTvl) * 100}%`,
              background: "linear-gradient(90deg, var(--accent), rgba(212,175,55,0.4))",
              transition: "width 1s ease",
              boxShadow: "0 0 6px var(--accent-glow)",
            }} />
          </div>
        </div>
      ))}
      {top5.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>
          Loading pool data…
        </div>
      )}
    </div>
  );
}

// ── Feature cards ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    to:      "/swap",
    icon:    ArrowLeftRight,
    label:   "SWAP",
    color:   "var(--accent)",
    desc:    "Multi-version DEX aggregator. Route trades through V2, V3 or V4 hooks for best execution.",
    stat:    "V2 · V3 · V4",
    sparkSymbol: "ETHUSDT",
  },
  {
    to:      "/pool",
    icon:    Droplets,
    label:   "POOL",
    color:   "#38bdf8",
    desc:    "Provide liquidity across Uniswap V2, concentrated V3 ranges, and hook-powered V4 pools.",
    stat:    "Up to 120% APR",
    sparkSymbol: "ETHUSDT",
  },
  {
    to:      "/perps",
    icon:    TrendingUp,
    label:   "PERPS",
    color:   "#f472b6",
    desc:    "Trade perpetual futures with up to 100x leverage. Pyth & Chainlink oracle pricing.",
    stat:    "100x Leverage",
    sparkSymbol: "BTCUSDT",
  },
  {
    to:      "/staking",
    icon:    Coins,
    label:   "STAKING",
    color:   "#a78bfa",
    desc:    "Stake tokens in third-party reviewed pools. Fixed and variable APY with audited contracts.",
    stat:    "High APY pools",
    sparkSymbol: "BNBUSDT",
  },
  {
    to:      "/farm",
    icon:    Layers,
    label:   "FARM",
    color:   "#34d399",
    desc:    "Deposit LP tokens to earn additional rewards on top of swap fees. Auto-compounding vaults.",
    stat:    "LP Farming",
    sparkSymbol: "SOLUSDT",
  },
  {
    to:      "/locker",
    icon:    Lock,
    label:   "LOCKER",
    color:   "#fb923c",
    desc:    "Lock tokens or LP positions on-chain with a time-lock. Proof of commitment for your community.",
    stat:    "Time-locked",
    sparkSymbol: "LINKUSDT",
  },
  {
    to:      "/quests",
    icon:    Trophy,
    label:   "QUESTS",
    color:   "#eab308",
    desc:    "Complete on-chain and social tasks to earn XP and protocol rewards. Powered by SIWE auth.",
    stat:    "Earn XP",
    sparkSymbol: "ETHUSDT",
  },
  {
    to:      "/bridge",
    icon:    ArrowRightLeft,
    label:   "BRIDGE",
    color:   "#22d3ee",
    desc:    "Cross-chain asset transfers between Ethereum, Base, Arbitrum, and more via trusted bridges.",
    stat:    "Multi-chain",
    sparkSymbol: "SOLUSDT",
  },
];

// ── Main landing page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const { data: pools } = useUniswapPools(1);

  const totalTvl = (pools ?? []).reduce((s, p) => s + p.tvlUSD, 0);
  const totalVol = (pools ?? []).reduce((s, p) => s + p.volume24h, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 4rem" }}>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "4rem 0 2.5rem", position: "relative" }}>
        {/* Glow orb */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)",
          padding: "0.3rem 0.9rem", marginBottom: "1.5rem",
          fontSize: 10, letterSpacing: "0.2em", color: "var(--accent)",
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <span style={{ width: 6, height: 6, background: "var(--accent)", animation: "punkPulse 2s ease-in-out infinite" }} />
          PROTOCOL LIVE ON MAINNET & BASE
        </div>

        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 900, fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
          lineHeight: 1.05, margin: "0 0 1rem",
          letterSpacing: "0.04em",
        }}>
          <span style={{ color: "var(--text)" }}>THE COMPLETE</span>
          <br />
          <span style={{
            color: "var(--accent)",
            textShadow: "0 0 40px var(--accent-glow)",
          }}>DEFI TERMINAL</span>
        </h1>

        <p style={{
          color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7,
          maxWidth: 560, margin: "0 auto 2rem",
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          Swap · Pool · Farm · Stake · Lock · Bridge · Trade Perps · Complete Quests —
          all in one interface.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2.5rem" }}>
          <Link to="/swap" style={{
            padding: "0.7rem 2rem",
            background: "var(--accent)", color: "var(--bg-deep)",
            fontWeight: 800, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Share Tech Mono', monospace",
            textDecoration: "none", border: "none",
            boxShadow: "0 0 20px var(--accent-glow)",
            display: "flex", alignItems: "center", gap: "0.4rem",
            transition: "all 0.12s",
          }}>
            LAUNCH APP  <ChevronRight size={14} />
          </Link>
          <Link to="/quests" style={{
            padding: "0.7rem 2rem",
            background: "transparent", color: "var(--text)",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Share Tech Mono', monospace",
            textDecoration: "none", border: "1px solid var(--border)",
          }}>
            EARN QUESTS
          </Link>
        </div>

        {/* Live price tickers */}
        <PriceTicker />
      </div>

      {/* ── Protocol stats ────────────────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "1px", background: "var(--border)",
        border: "1px solid var(--border)",
        marginBottom: "3.5rem",
        overflow: "hidden",
      }}>
        {[
          { value: Math.round(totalTvl / 1_000_000) || 28, label: "TVL (USD)",     prefix: "$", suffix: "M" },
          { value: Math.round(totalVol / 1_000_000) || 142, label: "24H VOLUME",   prefix: "$", suffix: "M" },
          { value: 8,                                        label: "FEATURES",    suffix: ""  },
          { value: 4,                                        label: "CHAINS",      suffix: ""  },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", padding: "1.75rem 1rem" }}>
            <AnimatedStat {...s} />
          </div>
        ))}
      </div>

      {/* ── TVL Chart + Pool Stats ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", marginBottom: "3.5rem", alignItems: "start" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--accent)", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Activity size={13} color="var(--accent)" />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", fontFamily: "'Share Tech Mono', monospace", color: "var(--text-muted)" }}>PROTOCOL TVL — 60 DAY</span>
          </div>
          <TvlChart />
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid #38bdf8", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <BarChart2 size={13} color="#38bdf8" />
            <span style={{ fontSize: 10, letterSpacing: "0.18em", fontFamily: "'Share Tech Mono', monospace", color: "var(--text-muted)" }}>TOP POOLS BY TVL</span>
          </div>
          <PoolStatsBar />
        </div>
      </div>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ width: 2, height: 18, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
          fontSize: 18, margin: 0, letterSpacing: "0.1em", color: "var(--text)",
        }}>PROTOCOL FEATURES</h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1px", background: "var(--border)",
        border: "1px solid var(--border)",
        marginBottom: "3.5rem",
        overflow: "hidden",
      }}>
        {FEATURES.map(f => (
          <Link key={f.to + f.label} to={f.to} style={{ textDecoration: "none", display: "block" }}>
            <div
              style={{ background: "var(--bg-card)", padding: "1.25rem", height: "100%", boxSizing: "border-box", transition: "background 0.12s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
              }}
            >
              {/* Top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: f.color, opacity: 0.7 }} />

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{
                  width: 36, height: 36,
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <f.icon size={16} color={f.color} />
                </div>
                <span style={{
                  fontSize: 9, letterSpacing: "0.15em",
                  color: f.color, fontFamily: "'Share Tech Mono', monospace",
                  border: `1px solid ${f.color}40`,
                  padding: "2px 6px",
                  background: `${f.color}10`,
                }}>
                  {f.stat}
                </span>
              </div>

              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 800,
                fontSize: 15, color: "var(--text)", letterSpacing: "0.08em",
                marginBottom: "0.35rem",
              }}>
                {f.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "0.85rem" }}>
                {f.desc}
              </div>

              {/* Sparkline */}
              <Sparkline symbol={f.sparkSymbol} color={f.color} height={48} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Why JinkFi ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div style={{ width: 2, height: 18, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
          fontSize: 18, margin: 0, letterSpacing: "0.1em", color: "var(--text)",
        }}>WHY JINKFI</h2>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "1rem", marginBottom: "3.5rem",
      }}>
        {[
          { icon: Shield, color: "#34d399", title: "Non-Custodial",  body: "Your keys, your tokens. All transactions are signed locally. We never hold funds." },
          { icon: Zap,    color: "var(--accent)", title: "Gas Optimised", body: "Smart routing minimises hops. V4 singleton pool architecture cuts gas up to 70%." },
          { icon: Users,  color: "#a78bfa", title: "Community Owned", body: "Protocol submissions are open to any project. Governance is on-chain and transparent." },
          { icon: Activity, color: "#f472b6", title: "Live Oracle Data", body: "Chainlink and Pyth feeds power perps pricing and on-chain quest verification." },
        ].map(item => (
          <div key={item.title} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderLeft: `3px solid ${item.color}`,
            padding: "1.1rem 1.1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <item.icon size={14} color={item.color} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text)", letterSpacing: "0.06em" }}>
                {item.title}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>{item.body}</p>
          </div>
        ))}
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderTop: "2px solid var(--accent)",
        padding: "2.5rem", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.06), transparent 70%)",
          pointerEvents: "none",
        }} />
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 900,
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)", margin: "0 0 0.5rem",
          letterSpacing: "0.06em", color: "var(--text)",
        }}>
          READY TO TRADE?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 1.75rem", fontFamily: "'Share Tech Mono', monospace" }}>
          Connect your wallet and start exploring the protocol.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/swap" style={{
            padding: "0.7rem 2rem",
            background: "var(--accent)", color: "var(--bg-deep)",
            fontWeight: 800, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Share Tech Mono', monospace",
            textDecoration: "none",
            boxShadow: "0 0 24px var(--accent-glow)",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            START SWAPPING <ChevronRight size={14} />
          </Link>
          <Link to="/perps" style={{
            padding: "0.7rem 2rem",
            background: "transparent", color: "#f472b6",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Share Tech Mono', monospace",
            textDecoration: "none", border: "1px solid rgba(244,114,182,0.4)",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            TRADE PERPS <TrendingUp size={13} />
          </Link>
          <Link to="/staking/create" style={{
            padding: "0.7rem 2rem",
            background: "transparent", color: "var(--text-muted)",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Share Tech Mono', monospace",
            textDecoration: "none", border: "1px solid var(--border)",
          }}>
            LIST YOUR PROJECT
          </Link>
        </div>
      </div>
    </div>
  );
}
