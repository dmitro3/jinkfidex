import SwapWidget from "../components/swap/SwapWidget";

export default function SwapPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 96px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <SwapWidget />
      <p style={{ marginTop: "1.5rem", fontSize: 12, color: "var(--text-muted)", textAlign: "center", maxWidth: 380 }}>
        Lightning-fast swaps with best-in-class routing across all major DEX liquidity sources.
      </p>
    </div>
  );
}
