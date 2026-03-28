import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  mainnet, sepolia, base, arbitrum, polygon, bsc, optimism,
  type AppKitNetwork,
} from "@reown/appkit/networks";
import { QueryClient } from "@tanstack/react-query";

// ── Custom chains not yet in @reown/appkit/networks ───────────────────────────

const monadTestnet: AppKitNetwork = {
  id: 10143,
  caipNetworkId: "eip155:10143",
  chainNamespace: "eip155",
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" } },
  testnet: true,
};

const hyperEVM: AppKitNetwork = {
  id: 999,
  caipNetworkId: "eip155:999",
  chainNamespace: "eip155",
  name: "HyperLiquid EVM",
  nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.hyperliquid.xyz/evm"] } },
  blockExplorers: { default: { name: "HyperEVM Explorer", url: "https://explorer.hyperliquid.xyz" } },
};

const plasmaChain: AppKitNetwork = {
  id: 361,
  caipNetworkId: "eip155:361",
  chainNamespace: "eip155",
  name: "Plasma",
  nativeCurrency: { name: "PLSM", symbol: "PLSM", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc2.plasmapay.com"] } },
  blockExplorers: { default: { name: "Plasma Explorer", url: "https://plasmaexplorer.app" } },
};

const tempoChain: AppKitNetwork = {
  id: 4217,
  caipNetworkId: "eip155:4217",
  chainNamespace: "eip155",
  name: "Tempo",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.tempo.xyz"] } },
  blockExplorers: { default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" } },
};

const megaETH: AppKitNetwork = {
  id: 6342,
  caipNetworkId: "eip155:6342",
  chainNamespace: "eip155",
  name: "MegaETH",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://carrot.megaeth.com/rpc"], webSocket: ["wss://carrot.megaeth.com/ws"] } },
  blockExplorers: { default: { name: "MegaETH Explorer", url: "https://megaeth.blockscout.com" } },
};

// ── QueryClient ───────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID ?? "YOUR_PROJECT_ID";

export const networks = [
  mainnet,
  base,
  arbitrum,
  polygon,
  optimism,
  bsc,
  monadTestnet,
  hyperEVM,
  plasmaChain,
  tempoChain,
  megaETH,
  sepolia,
] as const;

export const wagmiAdapter = new WagmiAdapter({
  networks: [...networks],
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [...networks],
  projectId,
  defaultNetwork: mainnet,
  metadata: {
    name: "JinkFI DEX",
    description: "The next-generation decentralized exchange",
    url: window.location.origin,
    icons: [`${window.location.origin}/logo.png`],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#d4af37",
    "--w3m-border-radius-master": "2px",
    "--w3m-font-family": "Inter, system-ui, sans-serif",
    "--w3m-color-mix": "#091f36",
    "--w3m-color-mix-strength": 40,
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
