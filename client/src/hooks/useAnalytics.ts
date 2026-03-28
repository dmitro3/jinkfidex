import { useQuery } from "@tanstack/react-query";

// ── Subgraph endpoints ────────────────────────────────────────────────────────

export const ANALYTICS_CHAINS: Record<number, { label: string; subgraph: string | null }> = {
  1: {
    label: "Ethereum",
    subgraph: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
  },
  11155111: {
    label: "Sepolia",
    subgraph: null, // custom deployment — no subgraph yet
  },
  8453: {
    label: "Base",
    subgraph: "https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest",
  },
  42161: {
    label: "Arbitrum",
    subgraph: "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum",
  },
};

async function gql<T>(chainId: number, query: string): Promise<T> {
  const cfg = ANALYTICS_CHAINS[chainId];
  if (!cfg?.subgraph) throw new Error(`No subgraph for chain ${chainId}`);
  const res = await fetch(cfg.subgraph, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Subgraph request failed");
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProtocolOverview {
  tvlUSD:    number;
  vol24h:    number;
  vol7d:     number;
  fees24h:   number;
  fees7d:    number;
  txCount:   number;
  poolCount: number;
}

export interface DayData {
  date:      number;   // unix timestamp (start of day)
  tvlUSD:    number;
  volumeUSD: number;
  feesUSD:   number;
  txCount:   number;
}

export interface AnalyticsToken {
  id:         string;
  symbol:     string;
  name:       string;
  priceUSD:   number;
  change24h:  number;    // %
  tvlUSD:     number;
  vol24h:     number;
  vol7d:      number;
  fees24h:    number;
}

export interface AnalyticsPool {
  id:           string;
  feeTier:      string;   // e.g. "0.30%"
  token0Symbol: string;
  token1Symbol: string;
  tvlUSD:       number;
  vol24h:       number;
  vol7d:        number;
  fees24h:      number;
  apr:          number;
}

export type TxType = "SWAP" | "ADD" | "REMOVE";
export interface AnalyticsTx {
  id:        string;
  type:      TxType;
  valueUSD:  number;
  amount0:   number;
  amount1:   number;
  token0:    string;
  token1:    string;
  account:   string;
  timestamp: number;
}

// ── Protocol overview ─────────────────────────────────────────────────────────

const OVERVIEW_QUERY = `{
  factories(first: 1) {
    txCount
    totalVolumeUSD
    totalFeesUSD
    totalValueLockedUSD
    poolCount
  }
  uniswapDayDatas(first: 7 orderBy: date orderDirection: desc) {
    volumeUSD
    feesUSD
    tvlUSD
    txCount
  }
}`;

export function useProtocolOverview(chainId: number) {
  return useQuery<ProtocolOverview>({
    queryKey: ["analytics-overview", chainId],
    queryFn: async () => {
      const data = await gql<{
        factories: Array<{ txCount: string; totalVolumeUSD: string; totalFeesUSD: string; totalValueLockedUSD: string; poolCount: string }>;
        uniswapDayDatas: Array<{ volumeUSD: string; feesUSD: string; tvlUSD: string; txCount: string }>;
      }>(chainId, OVERVIEW_QUERY);

      const f   = data.factories[0];
      const d   = data.uniswapDayDatas;
      const tvl = parseFloat(f?.totalValueLockedUSD ?? "0");

      return {
        tvlUSD:    tvl,
        vol24h:    parseFloat(d[0]?.volumeUSD ?? "0"),
        vol7d:     d.slice(0, 7).reduce((s, x) => s + parseFloat(x.volumeUSD), 0),
        fees24h:   parseFloat(d[0]?.feesUSD ?? "0"),
        fees7d:    d.slice(0, 7).reduce((s, x) => s + parseFloat(x.feesUSD), 0),
        txCount:   parseInt(d[0]?.txCount ?? "0", 10),
        poolCount: parseInt(f?.poolCount ?? "0", 10),
      };
    },
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Historical day data for charts ────────────────────────────────────────────

const HISTORY_QUERY = (days: number) => `{
  uniswapDayDatas(first: ${days} orderBy: date orderDirection: desc) {
    date
    tvlUSD
    volumeUSD
    feesUSD
    txCount
  }
}`;

export function useHistoricalData(chainId: number, days = 90) {
  return useQuery<DayData[]>({
    queryKey: ["analytics-history", chainId, days],
    queryFn: async () => {
      const data = await gql<{
        uniswapDayDatas: Array<{ date: string; tvlUSD: string; volumeUSD: string; feesUSD: string; txCount: string }>;
      }>(chainId, HISTORY_QUERY(days));

      return (data.uniswapDayDatas ?? [])
        .map(d => ({
          date:      parseInt(d.date, 10),
          tvlUSD:    parseFloat(d.tvlUSD),
          volumeUSD: parseFloat(d.volumeUSD),
          feesUSD:   parseFloat(d.feesUSD),
          txCount:   parseInt(d.txCount, 10),
        }))
        .reverse(); // oldest → newest for chart
    },
    staleTime: 120_000,
    retry: 1,
  });
}

// ── Top tokens ────────────────────────────────────────────────────────────────

const TOKENS_QUERY = `{
  tokens(
    first: 50
    orderBy: totalValueLockedUSD
    orderDirection: desc
    where: { totalValueLockedUSD_gt: "50000" }
  ) {
    id
    symbol
    name
    totalValueLockedUSD
    volumeUSD
    feesUSD
    tokenDayData(first: 8 orderBy: date orderDirection: desc) {
      date
      priceUSD
      volumeUSD
      feesUSD
    }
  }
}`;

export function useTopTokens(chainId: number) {
  return useQuery<AnalyticsToken[]>({
    queryKey: ["analytics-tokens", chainId],
    queryFn: async () => {
      const data = await gql<{
        tokens: Array<{
          id: string; symbol: string; name: string;
          totalValueLockedUSD: string; volumeUSD: string; feesUSD: string;
          tokenDayData: Array<{ date: string; priceUSD: string; volumeUSD: string; feesUSD: string }>;
        }>;
      }>(chainId, TOKENS_QUERY);

      return (data.tokens ?? []).map(t => {
        const d = t.tokenDayData;
        const price0 = parseFloat(d[0]?.priceUSD ?? "0");
        const price1 = parseFloat(d[1]?.priceUSD ?? price0.toString());
        const change = price1 > 0 ? ((price0 - price1) / price1) * 100 : 0;
        const vol7d  = d.slice(0, 7).reduce((s, x) => s + parseFloat(x.volumeUSD), 0);

        return {
          id:        t.id,
          symbol:    t.symbol,
          name:      t.name,
          priceUSD:  price0,
          change24h: change,
          tvlUSD:    parseFloat(t.totalValueLockedUSD),
          vol24h:    parseFloat(d[0]?.volumeUSD ?? "0"),
          vol7d,
          fees24h:   parseFloat(d[0]?.feesUSD ?? "0"),
        };
      });
    },
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Top pools ─────────────────────────────────────────────────────────────────

const POOLS_QUERY = `{
  pools(
    first: 50
    orderBy: totalValueLockedUSD
    orderDirection: desc
    where: { totalValueLockedUSD_gt: "10000" }
  ) {
    id
    feeTier
    totalValueLockedUSD
    volumeUSD
    feesUSD
    token0 { symbol }
    token1 { symbol }
    poolDayData(first: 7 orderBy: date orderDirection: desc) {
      volumeUSD
      feesUSD
      tvlUSD
    }
  }
}`;

export function useTopPools(chainId: number) {
  return useQuery<AnalyticsPool[]>({
    queryKey: ["analytics-pools", chainId],
    queryFn: async () => {
      const data = await gql<{
        pools: Array<{
          id: string; feeTier: string;
          totalValueLockedUSD: string; volumeUSD: string; feesUSD: string;
          token0: { symbol: string }; token1: { symbol: string };
          poolDayData: Array<{ volumeUSD: string; feesUSD: string; tvlUSD: string }>;
        }>;
      }>(chainId, POOLS_QUERY);

      return (data.pools ?? []).map(p => {
        const d      = p.poolDayData;
        const tvl    = parseFloat(p.totalValueLockedUSD);
        const vol24h = parseFloat(d[0]?.volumeUSD ?? "0");
        const vol7d  = d.reduce((s, x) => s + parseFloat(x.volumeUSD), 0);
        const fees24h = parseFloat(d[0]?.feesUSD ?? "0");
        const fees7d  = d.reduce((s, x) => s + parseFloat(x.feesUSD), 0);
        const apr    = tvl > 0 ? (fees7d / 7) * 365 / tvl * 100 : 0;

        return {
          id:           p.id,
          feeTier:      (parseInt(p.feeTier) / 10000).toFixed(2) + "%",
          token0Symbol: p.token0.symbol,
          token1Symbol: p.token1.symbol,
          tvlUSD: tvl, vol24h, vol7d, fees24h, apr,
        };
      });
    },
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Recent transactions ───────────────────────────────────────────────────────

const TXNS_QUERY = `{
  swaps(first: 25 orderBy: timestamp orderDirection: desc) {
    id timestamp amountUSD amount0 amount1
    token0 { symbol } token1 { symbol }
    origin
  }
  mints(first: 15 orderBy: timestamp orderDirection: desc) {
    id timestamp amountUSD amount0 amount1
    token0 { symbol } token1 { symbol }
    origin
  }
  burns(first: 15 orderBy: timestamp orderDirection: desc) {
    id timestamp amountUSD amount0 amount1
    token0 { symbol } token1 { symbol }
    origin
  }
}`;

type RawTx = { id: string; timestamp: string; amountUSD: string; amount0: string; amount1: string; token0: { symbol: string }; token1: { symbol: string }; origin: string };

export function useTransactions(chainId: number) {
  return useQuery<AnalyticsTx[]>({
    queryKey: ["analytics-txns", chainId],
    queryFn: async () => {
      const data = await gql<{ swaps: RawTx[]; mints: RawTx[]; burns: RawTx[] }>(chainId, TXNS_QUERY);

      const map = (type: TxType) => (t: RawTx): AnalyticsTx => ({
        id: t.id, type,
        valueUSD:  parseFloat(t.amountUSD),
        amount0:   Math.abs(parseFloat(t.amount0)),
        amount1:   Math.abs(parseFloat(t.amount1)),
        token0:    t.token0.symbol,
        token1:    t.token1.symbol,
        account:   t.origin,
        timestamp: parseInt(t.timestamp, 10),
      });

      return [
        ...(data.swaps  ?? []).map(map("SWAP")),
        ...(data.mints  ?? []).map(map("ADD")),
        ...(data.burns  ?? []).map(map("REMOVE")),
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 40);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
