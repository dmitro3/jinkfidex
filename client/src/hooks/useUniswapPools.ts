import { useQuery } from "@tanstack/react-query";
import type { Pool } from "../api/client";

// Uniswap v3 subgraph endpoints
const SUBGRAPH: Record<number, string> = {
  1:    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  8453: "https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest",
};

const POOL_QUERY = `
  query TopPools {
    pools(
      first: 25
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { totalValueLockedUSD_gt: "10000" }
    ) {
      id
      feeTier
      totalValueLockedUSD
      volumeUSD
      feesUSD
      token0 { id symbol }
      token1 { id symbol }
      poolDayData(first: 7 orderBy: date orderDirection: desc) {
        volumeUSD
        feesUSD
        tvlUSD
      }
    }
  }
`;

interface SubgraphPool {
  id: string;
  feeTier: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  token0: { id: string; symbol: string };
  token1: { id: string; symbol: string };
  poolDayData: Array<{ volumeUSD: string; feesUSD: string; tvlUSD: string }>;
}

async function fetchUniswapPools(chainId: number): Promise<Pool[]> {
  const url = SUBGRAPH[chainId];
  if (!url) return [];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: POOL_QUERY }),
  });

  if (!res.ok) throw new Error("Subgraph request failed");

  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors[0].message);

  const pools: SubgraphPool[] = data?.pools ?? [];

  return pools.map((p): Pool => {
    const tvl    = parseFloat(p.totalValueLockedUSD);
    const vol24h = parseFloat(p.poolDayData[0]?.volumeUSD ?? "0");
    const fees7d = p.poolDayData.reduce((s, d) => s + parseFloat(d.feesUSD), 0);
    // APR = annualized fee yield on TVL
    const apr = tvl > 0 ? (fees7d / 7) * 365 / tvl * 100 : 0;

    const feePct = (parseInt(p.feeTier) / 10000).toFixed(2) + "%";

    return {
      id:           p.id,
      address:      p.id,
      chainId,
      token0Symbol: p.token0.symbol,
      token1Symbol: p.token1.symbol,
      reserve0:     "0",
      reserve1:     "0",
      tvlUSD:       tvl,
      volume24h:    vol24h,
      apr:          apr,
      feeTier:      feePct,
    };
  });
}

export function useUniswapPools(chainId: number) {
  return useQuery<Pool[]>({
    queryKey: ["uniswap-pools", chainId],
    queryFn:  () => fetchUniswapPools(chainId),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: 120_000,
  });
}
