import { useEffect, useRef, useState, useCallback } from "react";
import { ExternalLink, TrendingUp, TrendingDown, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { createChart, AreaSeries, HistogramSeries, ColorType } from "lightweight-charts";
import type { UTCTimestamp } from "lightweight-charts";
import {
  ANALYTICS_CHAINS,
  useProtocolOverview, useHistoricalData,
  useTopTokens, useTopPools, useTransactions,
  type AnalyticsToken, type AnalyticsPool, type AnalyticsTx, type DayData,
} from "../hooks/useAnalytics";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtUSD(n: number, compact = true): string {
  if (!n || isNaN(n)) return "$0";
  if (compact) {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  }
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtPrice(n: number): string {
  if (!n || isNaN(n)) return "$—";
  if (n < 0.0001) return `$${n.toExponential(2)}`;
  if (n < 1)      return `$${n.toFixed(6)}`;
  if (n < 10)     return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtTime(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

function trunc(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 16, radius = 4 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "rgba(255,255,255,0.05)",
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div style={{
      flex: "1 1 140px",
      padding: "0.9rem 1.1rem",
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 12,
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
        {label}
      </div>
      {loading
        ? <Skeleton h={22} />
        : <div style={{ fontWeight: 900, fontSize: 20, fontFamily: "'Rajdhani', sans-serif", color: "var(--text)" }}>{value}</div>
      }
      {sub && !loading && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: "0.15rem" }}>{sub}</div>
      )}
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

type ChartMode = "tvl" | "volume" | "fees";
type RangeKey  = "30" | "90" | "180" | "all";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "30",  label: "1M",   days: 30  },
  { key: "90",  label: "3M",   days: 90  },
  { key: "180", label: "6M",   days: 180 },
  { key: "all", label: "All",  days: 365 },
];

function AnalyticsChart({ data, loading }: { data: DayData[]; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<ReturnType<typeof createChart> | null>(null);
  const [mode,  setMode]  = useState<ChartMode>("tvl");
  const [range, setRange] = useState<RangeKey>("90");
  const [hoverVal,  setHoverVal]  = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const rangeData = useCallback(() => {
    if (!data.length) return [];
    const days = RANGES.find(r => r.key === range)?.days ?? 90;
    return data.slice(-days);
  }, [data, range]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor:  "rgba(180,180,180,0.8)",
        fontSize:   11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale:  { mouseWheel: false, pinch: false },
    });
    chartRef.current = chart;

    const pts = rangeData();
    const accentColor = mode === "tvl" ? "#00e5a0" : mode === "volume" ? "#a78bfa" : "#facc15";

    if (mode === "tvl") {
      const series = chart.addSeries(AreaSeries, {
        topColor:        `${accentColor}30`,
        bottomColor:     `${accentColor}04`,
        lineColor:       accentColor,
        lineWidth:       2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      series.setData(pts.map(d => ({ time: d.date as UTCTimestamp, value: d.tvlUSD })));
    } else {
      const field = mode === "volume" ? "volumeUSD" : "feesUSD";
      const series = chart.addSeries(HistogramSeries, {
        color: accentColor,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(pts.map(d => ({
        time:  d.date as UTCTimestamp,
        value: d[field],
        color: `${accentColor}cc`,
      })));
    }

    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove(param => {
      if (!param.time) { setHoverVal(null); setHoverDate(null); return; }
      const entry = pts.find(d => d.date === param.time);
      if (!entry) return;
      const val = mode === "tvl" ? entry.tvlUSD : mode === "volume" ? entry.volumeUSD : entry.feesUSD;
      setHoverVal(fmtUSD(val));
      setHoverDate(new Date((param.time as number) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(containerRef.current.clientWidth, 260);
      }
    });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [mode, range, rangeData]);

  const latestVal = (() => {
    const pts = rangeData();
    if (!pts.length) return null;
    const last = pts[pts.length - 1];
    return mode === "tvl" ? last.tvlUSD : mode === "volume" ? last.volumeUSD : last.feesUSD;
  })();

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem", marginBottom: "2rem" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          {/* Mode tabs */}
          <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "0.2rem", border: "1px solid var(--border)", width: "fit-content", marginBottom: "0.6rem" }}>
            {(["tvl", "volume", "fees"] as ChartMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "0.3rem 0.8rem", borderRadius: 6, border: "none", cursor: "pointer",
                background: mode === m ? "var(--bg-card2, rgba(255,255,255,0.08))" : "transparent",
                color: mode === m ? "var(--text)" : "var(--text-muted)",
                fontWeight: 700, fontSize: 12,
                boxShadow: mode === m ? "inset 0 0 0 1px var(--border)" : "none",
                transition: "all 0.12s",
              }}>
                {m === "tvl" ? "TVL" : m === "volume" ? "Volume" : "Fees"}
              </button>
            ))}
          </div>
          {/* Hover value */}
          <div>
            <div style={{ fontWeight: 900, fontSize: 28, fontFamily: "'Rajdhani', sans-serif", color: "var(--text)", lineHeight: 1 }}>
              {loading ? <Skeleton h={28} w={160} /> : (hoverVal ?? (latestVal !== null ? fmtUSD(latestVal) : "—"))}
            </div>
            {hoverDate && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: "0.2rem" }}>{hoverDate}</div>}
          </div>
        </div>

        {/* Range buttons */}
        <div style={{ display: "flex", gap: "0.2rem" }}>
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              padding: "0.3rem 0.65rem", borderRadius: 6, border: "none", cursor: "pointer",
              background: range === r.key ? "var(--accent)" : "transparent",
              color: range === r.key ? "#001220" : "var(--text-muted)",
              fontWeight: 700, fontSize: 11,
              transition: "all 0.12s",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading
        ? <Skeleton h={260} radius={8} />
        : <div ref={containerRef} style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />
      }
    </div>
  );
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

function SortHeader({ label, col, sortCol, sortDir, onSort, align = "right" }: {
  label: string; col: string; sortCol: string; sortDir: SortDir;
  onSort: (col: string) => void; align?: "left" | "right";
}) {
  const active = sortCol === col;
  return (
    <th
      onClick={() => onSort(col)}
      style={{
        textAlign: align, cursor: "pointer", userSelect: "none",
        padding: "0.5rem 0.75rem",
        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontFamily: "'Share Tech Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      {label}{" "}
      {active
        ? (sortDir === "desc" ? <ChevronDown size={10} style={{ display: "inline" }} /> : <ChevronUp size={10} style={{ display: "inline" }} />)
        : <span style={{ opacity: 0.3 }}>↕</span>
      }
    </th>
  );
}

function useSortable<T>(data: T[], defaultCol: keyof T) {
  const [col, setCol] = useState<keyof T>(defaultCol);
  const [dir, setDir] = useState<SortDir>("desc");

  const onSort = useCallback((c: string) => {
    if (c === col) setDir(d => d === "desc" ? "asc" : "desc");
    else { setCol(c as keyof T); setDir("desc"); }
  }, [col]);

  const sorted = [...data].sort((a, b) => {
    const av = a[col], bv = b[col];
    if (typeof av === "number" && typeof bv === "number") return dir === "desc" ? bv - av : av - bv;
    return 0;
  });

  return { sorted, col: col as string, dir, onSort };
}

// ── Token table ───────────────────────────────────────────────────────────────

function TokenTable({ tokens, loading, chainId }: { tokens: AnalyticsToken[]; loading: boolean; chainId: number }) {
  const { sorted, col, dir, onSort } = useSortable(tokens, "tvlUSD");
  const explorer = chainId === 8453 ? "https://basescan.org/token/" : chainId === 42161 ? "https://arbiscan.io/token/" : "https://etherscan.io/token/";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: "2rem" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontWeight: 900, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em" }}>TOP TOKENS</span>
        {!loading && <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{tokens.length} tokens</span>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", fontWeight: 800, letterSpacing: "0.1em" }}>#</th>
              <SortHeader label="TOKEN"    col="name"     sortCol={col} sortDir={dir} onSort={onSort} align="left" />
              <SortHeader label="PRICE"    col="priceUSD" sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="24H %"    col="change24h" sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="TVL"      col="tvlUSD"   sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="VOL 24H"  col="vol24h"   sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="VOL 7D"   col="vol7d"    sortCol={col} sortDir={dir} onSort={onSort} />
              <th style={{ padding: "0.5rem 0.75rem", width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: "0.75rem" }}><Skeleton h={14} /></td>
                    ))}
                  </tr>
                ))
              : sorted.map((t, i) => {
                  const isUp = t.change24h >= 0;
                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "0.75rem", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{i + 1}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                            background: `hsl(${t.symbol.charCodeAt(0) * 37 % 360}, 60%, 40%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: "#fff",
                          }}>
                            {t.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{t.symbol}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>{fmtPrice(t.priceUSD)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, fontSize: 13, color: isUp ? "var(--neon, #00e5a0)" : "#f87171" }}>
                        {isUp ? <TrendingUp size={11} style={{ display: "inline", marginRight: 3 }} /> : <TrendingDown size={11} style={{ display: "inline", marginRight: 3 }} />}
                        {isUp ? "+" : ""}{t.change24h.toFixed(2)}%
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, fontSize: 13 }}>{fmtUSD(t.tvlUSD)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>{fmtUSD(t.vol24h)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>{fmtUSD(t.vol7d)}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <a href={`${explorer}${t.id}`} target="_blank" rel="noreferrer"
                          style={{ color: "var(--text-muted)", opacity: 0.45, display: "flex", alignItems: "center" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
                        >
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pool table ────────────────────────────────────────────────────────────────

function PoolTable({ pools, loading, chainId }: { pools: AnalyticsPool[]; loading: boolean; chainId: number }) {
  const { sorted, col, dir, onSort } = useSortable(pools, "tvlUSD");
  const explorer = chainId === 8453 ? "https://basescan.org/address/" : chainId === 42161 ? "https://arbiscan.io/address/" : "https://etherscan.io/address/";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: "2rem" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontWeight: 900, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em" }}>TOP POOLS</span>
        {!loading && <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{pools.length} pools</span>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", fontWeight: 800, letterSpacing: "0.1em" }}>#</th>
              <SortHeader label="POOL"     col="token0Symbol" sortCol={col} sortDir={dir} onSort={onSort} align="left" />
              <SortHeader label="TVL"      col="tvlUSD"       sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="VOL 24H"  col="vol24h"       sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="VOL 7D"   col="vol7d"        sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="FEES 24H" col="fees24h"      sortCol={col} sortDir={dir} onSort={onSort} />
              <SortHeader label="APR"      col="apr"          sortCol={col} sortDir={dir} onSort={onSort} />
              <th style={{ padding: "0.5rem 0.75rem", width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: "0.75rem" }}><Skeleton h={14} /></td>
                    ))}
                  </tr>
                ))
              : sorted.map((p, i) => {
                  const aprColor = p.apr > 100 ? "#4ade80" : p.apr > 50 ? "#facc15" : "var(--text)";
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "0.75rem", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{i + 1}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          {/* Overlapping token icons */}
                          <div style={{ display: "flex", marginRight: 4 }}>
                            {[p.token0Symbol, p.token1Symbol].map((sym, k) => (
                              <div key={k} style={{
                                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                background: `hsl(${sym.charCodeAt(0) * 37 % 360}, 60%, 35%)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 8, fontWeight: 800, color: "#fff",
                                marginLeft: k > 0 ? -8 : 0,
                                border: "2px solid var(--bg-card)",
                                zIndex: k,
                              }}>
                                {sym.slice(0, 3)}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{p.token0Symbol}/{p.token1Symbol}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{p.feeTier}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600, fontSize: 13 }}>{fmtUSD(p.tvlUSD)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>{fmtUSD(p.vol24h)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>{fmtUSD(p.vol7d)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontSize: 13, color: "var(--text-muted)" }}>{fmtUSD(p.fees24h)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 700, fontSize: 13, color: aprColor }}>{p.apr.toFixed(1)}%</td>
                      <td style={{ padding: "0.75rem" }}>
                        <a href={`${explorer}${p.id}`} target="_blank" rel="noreferrer"
                          style={{ color: "var(--text-muted)", opacity: 0.45, display: "flex", alignItems: "center" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
                        >
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Transactions ──────────────────────────────────────────────────────────────

const TX_COLORS: Record<string, string> = {
  SWAP:   "#a78bfa",
  ADD:    "var(--neon, #00e5a0)",
  REMOVE: "#f87171",
};

function TxTable({ txns, loading, chainId }: { txns: AnalyticsTx[]; loading: boolean; chainId: number }) {
  const [show, setShow] = useState(15);
  const explorer = chainId === 8453 ? "https://basescan.org/tx/" : chainId === 42161 ? "https://arbiscan.io/tx/" : "https://etherscan.io/tx/";

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: "2rem" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontWeight: 900, fontSize: 15, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em" }}>TRANSACTIONS</span>
        {!loading && <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{txns.length} recent</span>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["TYPE", "VALUE", "TOKEN AMOUNT", "ACCOUNT", "TIME"].map((h, i) => (
                <th key={h} style={{
                  padding: "0.5rem 0.75rem",
                  textAlign: i === 0 || i === 4 ? "left" : i >= 2 ? "right" : "right",
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                  color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace",
                  whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
              <th style={{ width: 28 }} />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: "0.7rem" }}><Skeleton h={13} /></td>
                    ))}
                  </tr>
                ))
              : txns.slice(0, show).map(tx => (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "0.7rem 0.75rem" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                        color: TX_COLORS[tx.type],
                        border: `1px solid ${TX_COLORS[tx.type]}`,
                        padding: "2px 7px", fontFamily: "'Share Tech Mono', monospace",
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 0.75rem", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                      {fmtUSD(tx.valueUSD)}
                    </td>
                    <td style={{ padding: "0.7rem 0.75rem", textAlign: "right", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>
                      {tx.amount0.toFixed(2)} {tx.token0}
                      <span style={{ margin: "0 0.3rem", opacity: 0.4 }}>{tx.type === "SWAP" ? "→" : "+"}</span>
                      {tx.amount1.toFixed(2)} {tx.token1}
                    </td>
                    <td style={{ padding: "0.7rem 0.75rem", textAlign: "right" }}>
                      <a
                        href={`https://etherscan.io/address/${tx.account}`}
                        target="_blank" rel="noreferrer"
                        style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontFamily: "'Share Tech Mono', monospace" }}
                      >
                        {trunc(tx.account)}
                      </a>
                    </td>
                    <td style={{ padding: "0.7rem 0.75rem", fontSize: 11, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", whiteSpace: "nowrap" }}>
                      {fmtTime(tx.timestamp)}
                    </td>
                    <td style={{ padding: "0.7rem 0.75rem" }}>
                      <a href={`${explorer}${tx.id.split("#")[0]}`} target="_blank" rel="noreferrer"
                        style={{ color: "var(--text-muted)", opacity: 0.4, display: "flex", alignItems: "center" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
                      >
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      {!loading && txns.length > show && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <button onClick={() => setShow(n => n + 15)} style={{
            background: "none", border: "1px solid var(--border)", color: "var(--text-muted)",
            padding: "0.4rem 1.25rem", cursor: "pointer", fontSize: 12,
            fontFamily: "'Share Tech Mono', monospace", borderRadius: 6,
          }}>
            LOAD MORE
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [chainId, setChainId] = useState(1);
  const [chainOpen, setChainOpen] = useState(false);

  const { data: overview,  isLoading: ovLoading,   refetch: refetchOv  } = useProtocolOverview(chainId);
  const { data: history,   isLoading: histLoading                       } = useHistoricalData(chainId, 365);
  const { data: tokens = [], isLoading: tokLoading,  refetch: refetchTok } = useTopTokens(chainId);
  const { data: pools  = [], isLoading: poolLoading, refetch: refetchPool } = useTopPools(chainId);
  const { data: txns   = [], isLoading: txLoading,   refetch: refetchTx  } = useTransactions(chainId);

  const isAnyLoading = ovLoading || histLoading || tokLoading || poolLoading || txLoading;

  function refreshAll() {
    refetchOv(); refetchTok(); refetchPool(); refetchTx();
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 30, marginBottom: "0.2rem", letterSpacing: "-0.5px" }}>Analytics</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            Protocol-wide stats sourced from Uniswap V3 subgraph
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Refresh */}
          <button
            onClick={refreshAll}
            title="Refresh data"
            style={{
              background: "none", border: "1px solid var(--border)", color: "var(--text-muted)",
              padding: "0.4rem 0.6rem", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center",
            }}
          >
            <RefreshCw size={13} style={isAnyLoading ? { animation: "spin 1s linear infinite" } : undefined} />
          </button>

          {/* Chain selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setChainOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.45rem 0.85rem", borderRadius: 8,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              {ANALYTICS_CHAINS[chainId]?.label}
              <ChevronDown size={13} />
            </button>
            {chainOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 10, overflow: "hidden", minWidth: 130,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}>
                {Object.entries(ANALYTICS_CHAINS).map(([id, cfg]) => (
                  <button
                    key={id}
                    onClick={() => { setChainId(Number(id)); setChainOpen(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "0.55rem 0.85rem", background: "none", border: "none",
                      color: Number(id) === chainId ? "var(--accent)" : "var(--text)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <StatCard label="TVL"          value={fmtUSD(overview?.tvlUSD  ?? 0)} loading={ovLoading} />
        <StatCard label="VOLUME 24H"   value={fmtUSD(overview?.vol24h  ?? 0)} loading={ovLoading} />
        <StatCard label="VOLUME 7D"    value={fmtUSD(overview?.vol7d   ?? 0)} loading={ovLoading} />
        <StatCard label="FEES 24H"     value={fmtUSD(overview?.fees24h ?? 0)} loading={ovLoading} />
        <StatCard label="FEES 7D"      value={fmtUSD(overview?.fees7d  ?? 0)} loading={ovLoading} />
        <StatCard label="TXS 24H"      value={fmtNum(overview?.txCount    ?? 0)} loading={ovLoading} />
        <StatCard label="POOLS"        value={fmtNum(overview?.poolCount  ?? 0)} loading={ovLoading} />
      </div>

      {/* ── Charts ──────────────────────────────────────────────── */}
      <AnalyticsChart data={history ?? []} loading={histLoading} />

      {/* ── Tokens ──────────────────────────────────────────────── */}
      <TokenTable tokens={tokens} loading={tokLoading} chainId={chainId} />

      {/* ── Pools ───────────────────────────────────────────────── */}
      <PoolTable pools={pools} loading={poolLoading} chainId={chainId} />

      {/* ── Transactions ────────────────────────────────────────── */}
      <TxTable txns={txns} loading={txLoading} chainId={chainId} />

    </div>
  );
}
