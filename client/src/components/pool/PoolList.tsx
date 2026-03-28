import { useQuery } from "@tanstack/react-query";
import { poolApi, type Pool } from "../../api/client";
import { useChainId } from "wagmi";
import { useUniswapPools } from "../../hooks/useUniswapPools";
import { useOnChainPools } from "../../hooks/useOnChainPools";
import { ExternalLink } from "lucide-react";

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

const CHAIN_EXPLORER: Record<number, string> = {
  1:        "https://etherscan.io/address/",
  11155111: "https://sepolia.etherscan.io/address/",
  8453:     "https://basescan.org/address/",
};

export default function PoolList() {
  const chainId = useChainId();

  const { data: subgraphPools, isLoading: sgLoading } = useUniswapPools(chainId);
  const onChainPools = useOnChainPools();

  const { data: serverPools, isLoading: serverLoading } = useQuery({
    queryKey: ["pools", chainId],
    queryFn: () => poolApi.list(chainId),
    staleTime: 30_000,
    retry: false,
  });

  const isLoading = sgLoading && serverLoading && onChainPools.length === 0;

  // Prefer subgraph > on-chain > server
  const pools: Pool[] = subgraphPools?.length
    ? subgraphPools
    : onChainPools.length
      ? onChainPools
      : serverPools ?? [];

  const isLive = !!(subgraphPools?.length || onChainPools.length || serverPools?.length);
  const source = subgraphPools?.length ? "subgraph" : onChainPools.length ? "on-chain" : serverPools?.length ? "server" : null;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 64, background: "var(--bg-input)", border: "1px solid var(--border)", animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {/* Header row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 32px",
        gap: "0.5rem",
        padding: "0.4rem 1rem",
        fontSize: 10, fontWeight: 800,
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        fontFamily: "'Share Tech Mono', monospace",
      }}>
        <span>POOL</span>
        <span style={{ textAlign: "right" }}>TVL</span>
        <span style={{ textAlign: "right" }}>VOL 24H</span>
        <span style={{ textAlign: "right" }}>APR</span>
        <span style={{ textAlign: "right" }}>FEE</span>
        <span />
      </div>

      {pools.length > 0 ? (
        pools.map(pool => <PoolRow key={pool.id} pool={pool} chainId={chainId} />)
      ) : (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: 13, fontFamily: "'Share Tech Mono', monospace" }}>
          No pools found on this chain yet.
        </div>
      )}

      {/* Data source indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.6rem 1rem", marginTop: "0.25rem",
        fontSize: 10, color: "var(--text-muted)",
        fontFamily: "'Share Tech Mono', monospace",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ width: 5, height: 5, background: isLive ? "#4ade80" : "var(--text-muted)", borderRadius: "50%" }} />
        {isLive
          ? `LIVE · ${source === "subgraph" ? "Uniswap subgraph" : source === "on-chain" ? "On-chain factory" : "Server"} · ${pools.length} pools`
          : "No live data — connect wallet to load on-chain pools"
        }
      </div>
    </div>
  );
}

function PoolRow({ pool, chainId }: { pool: Pool; chainId: number }) {
  const explorerBase = CHAIN_EXPLORER[chainId] ?? "https://etherscan.io/address/";
  const aprColor = pool.apr > 50 ? "#4ade80" : pool.apr > 20 ? "#facc15" : "var(--text)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 32px",
        gap: "0.5rem",
        alignItems: "center",
        padding: "0.85rem 1rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "all 0.12s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.background = "var(--bg-card2)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "var(--bg-card)";
      }}
    >
      {/* Token pair */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ display: "flex" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#fff",
          }}>
            {pool.token0Symbol.slice(0, 3)}
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #1a6b8a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#fff",
            marginLeft: -10,
          }}>
            {pool.token1Symbol.slice(0, 3)}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            {pool.token0Symbol}/{pool.token1Symbol}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>
            {pool.address.slice(0, 6)}…{pool.address.slice(-4)}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right", fontWeight: 600, fontSize: 14 }}>{fmt(pool.tvlUSD)}</div>
      <div style={{ textAlign: "right", fontWeight: 500, fontSize: 14, color: "var(--text-muted)" }}>{fmt(pool.volume24h)}</div>
      <div style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: aprColor }}>{pool.apr.toFixed(2)}%</div>
      <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{pool.feeTier}</div>

      {/* Explorer link */}
      <a
        href={`${explorerBase}${pool.address}`}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", opacity: 0.4 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
      >
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
