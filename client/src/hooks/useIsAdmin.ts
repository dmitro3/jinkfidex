import { useAccount } from "wagmi";

// Admin addresses are set via VITE_ADMIN_ADDRESSES (comma-separated, lowercase)
// Example: VITE_ADMIN_ADDRESSES=0xabc...,0xdef...
// If the env var is empty every connected wallet is treated as admin (dev mode).

const RAW = import.meta.env.VITE_ADMIN_ADDRESSES as string | undefined;

const ADMIN_ADDRESSES: Set<string> = new Set(
  RAW
    ? RAW.split(",").map(a => a.trim().toLowerCase()).filter(Boolean)
    : [],
);

const DEV_MODE = ADMIN_ADDRESSES.size === 0;

export function useIsAdmin(): boolean {
  const { address, isConnected } = useAccount();
  if (!isConnected || !address) return false;
  if (DEV_MODE) return true; // no restriction when env var not set
  return ADMIN_ADDRESSES.has(address.toLowerCase());
}
