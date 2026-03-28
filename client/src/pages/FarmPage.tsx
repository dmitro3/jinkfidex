import { useState } from "react";
import { Search, Sprout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { farmApi } from "../api/client";
import type { FarmInfo } from "../lib/farms";
import FarmCard from "../components/farm/FarmCard";

export default function FarmPage() {
  const chainId = useChainId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"apr" | "tvl">("apr");

  const { data: serverFarms, isLoading } = useQuery({
    queryKey: ["farms", chainId],
    queryFn: () => farmApi.list(chainId),
    staleTime: 60_000,
    retry: false,
  });

  const allFarms = (serverFarms ?? []) as unknown as FarmInfo[];

  const filtered = allFarms
    .filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "apr" ? b.aprPercent - a.aprPercent : b.tvlUSD - a.tvlUSD);

  const totalTVL = allFarms.reduce((s, f) => s + f.tvlUSD, 0);
  const bestApr  = allFarms.length ? Math.max(...allFarms.map(f => f.aprPercent)) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: 28, marginBottom: "0.5rem" }}>Yield Farming</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: "1.5rem" }}>Stake LP tokens to earn JINK rewards.</p>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Total Value Locked", value: totalTVL > 0 ? `$${(totalTVL / 1_000_000).toFixed(2)}M` : "—" },
          { label: "Active Farms",       value: allFarms.length || "—" },
          { label: "Best APR",           value: bestApr > 0 ? `${bestApr.toFixed(1)}%` : "—" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "0.3rem" }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: 22, color: "var(--text)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.5rem 0.85rem" }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search farms..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 14, flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", background: "var(--bg-input)", borderRadius: 10, padding: "0.25rem" }}>
          {(["apr", "tvl"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{ padding: "0.35rem 0.85rem", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: sort === s ? "var(--bg-card)" : "transparent", color: sort === s ? "var(--text)" : "var(--text-muted)", textTransform: "uppercase" }}
            >{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr auto", gap: "0.75rem", padding: "0.5rem 1.25rem", fontSize: 12, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
            <span>Farm</span>
            <span style={{ textAlign: "center" }}>APR</span>
            <span style={{ textAlign: "center" }}>TVL</span>
            <span style={{ textAlign: "center" }}>Multiplier</span>
            <span style={{ textAlign: "center" }}>Earned</span>
            <span />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map(farm => <FarmCard key={farm.pid} farm={farm} />)}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "5rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <Sprout size={36} style={{ opacity: 0.2, marginBottom: "1rem" }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: "0.5rem" }}>No farms available</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Farms will appear here once pools are configured on-chain.</div>
        </div>
      )}
    </div>
  );
}
