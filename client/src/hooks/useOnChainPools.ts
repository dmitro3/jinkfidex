/**
 * useOnChainPools — reads V2 pairs directly from the deployed factory.
 * Used as a live fallback on chains that don't have a Uniswap subgraph
 * (e.g. our custom Sepolia deployment).
 */

import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { CONTRACT_ADDRESSES, FACTORY_ABI, PAIR_ABI, ERC20_ABI } from "../lib/contracts";
import type { Pool } from "../api/client";

const MAX_PAIRS = 15;

export function useOnChainPools(): Pool[] {
  const chainId   = useChainId();
  const addrs     = CONTRACT_ADDRESSES[chainId];
  const factory   = addrs?.factory as `0x${string}` | undefined;
  const enabled   = !!factory &&
    factory !== "0x0000000000000000000000000000000000000001" &&
    factory !== "0x0000000000000000000000000000000000000002";

  // Step 1 — how many pairs exist?
  const { data: pairCount } = useReadContract({
    address: factory,
    abi: FACTORY_ABI,
    functionName: "allPairsLength",
    query: { enabled },
  });

  const count   = Number(pairCount ?? 0);
  const indices = Array.from({ length: Math.min(count, MAX_PAIRS) }, (_, i) => BigInt(count - 1 - i));

  // Step 2 — get the last N pair addresses
  const { data: pairAddressData } = useReadContracts({
    contracts: (enabled && factory)
      ? indices.map(i => ({
          address: factory,
          abi: FACTORY_ABI,
          functionName: "allPairs" as const,
          args: [i] as [bigint],
        }))
      : [],
    query: { enabled: enabled && indices.length > 0 },
  });

  const pairAddresses = (pairAddressData ?? [])
    .map(r => r.result as `0x${string}`)
    .filter(Boolean);

  // Step 3 — for each pair: token0, token1, reserves
  const { data: pairDetails } = useReadContracts({
    contracts: pairAddresses.flatMap(addr => [
      { address: addr, abi: PAIR_ABI, functionName: "token0"      as const },
      { address: addr, abi: PAIR_ABI, functionName: "token1"      as const },
      { address: addr, abi: PAIR_ABI, functionName: "getReserves" as const },
    ]),
    query: { enabled: pairAddresses.length > 0 },
  });

  const pairs = pairAddresses.map((addr, i) => ({
    address: addr,
    token0:    (pairDetails?.[i * 3    ]?.result ?? "") as `0x${string}`,
    token1:    (pairDetails?.[i * 3 + 1]?.result ?? "") as `0x${string}`,
    reserves:   pairDetails?.[i * 3 + 2]?.result as [bigint, bigint, number] | undefined,
  })).filter(p => p.token0 && p.token1);

  // Step 4 — resolve symbols for all unique token addresses
  const tokenAddresses = [...new Set(pairs.flatMap(p => [p.token0, p.token1]))]
    .filter(a => !!a) as `0x${string}`[];

  const { data: symbolData } = useReadContracts({
    contracts: tokenAddresses.map(addr => ({
      address: addr,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    })),
    query: { enabled: tokenAddresses.length > 0 },
  });

  const symbolMap: Record<string, string> = {};
  tokenAddresses.forEach((addr, i) => {
    symbolMap[addr] = (symbolData?.[i]?.result as string) ?? addr.slice(0, 6);
  });

  return pairs.map(p => ({
    id:           p.address,
    address:      p.address,
    chainId,
    token0Symbol: symbolMap[p.token0] ?? p.token0.slice(0, 6),
    token1Symbol: symbolMap[p.token1] ?? p.token1.slice(0, 6),
    reserve0:     (p.reserves?.[0] ?? 0n).toString(),
    reserve1:     (p.reserves?.[1] ?? 0n).toString(),
    tvlUSD:       0,
    volume24h:    0,
    apr:          0,
    feeTier:      "0.3%",
  }));
}
