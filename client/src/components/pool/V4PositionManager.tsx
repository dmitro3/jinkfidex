import { useState } from "react";
import { Plus, ExternalLink, Puzzle, Loader, CheckCircle, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import TokenSelector from "../swap/TokenSelector";
import FeeTierSelector from "../swap/FeeTierSelector";
import HookSelector from "../swap/HookSelector";
import V3RangeSelector from "./V3RangeSelector";
import { useV4Position } from "../../hooks/useV4Position";

type SelectorTarget = "a" | "b" | null;

export default function V4PositionManager() {
  const { isConnected } = useAccount();
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [initPrice, setInitPrice] = useState("");
  const pos = useV4Position();

  const canMint = !!pos.tokenA && !!pos.tokenB && !!pos.amountA && !!pos.amountB &&
    !!pos.minPrice && !!pos.maxPrice && isConnected && pos.poolExists;

  const ctaLabel = !isConnected
    ? "Connect Wallet"
    : !pos.tokenA || !pos.tokenB ? "Select a Pair"
    : !pos.poolExists ? "Pool Not Initialized"
    : !pos.minPrice || !pos.maxPrice ? "Set Price Range"
    : !pos.amountA || !pos.amountB ? "Enter Deposit Amounts"
    : pos.needsApprove0 ? `Approve ${pos.token0?.symbol}`
    : pos.needsApprove1 ? `Approve ${pos.token1?.symbol}`
    : "Add V4 Liquidity";

  const handleCta = () => {
    if (pos.needsApprove0) { pos.approve0(); return; }
    if (pos.needsApprove1) { pos.approve1(); return; }
    pos.mint();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>

      {/* ── Card header ───────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.7rem",
        marginBottom: "1.25rem",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Zap size={15} color="var(--neon)" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
            New V4 Position
            <span style={{
              marginLeft: "0.5rem", fontSize: 10, fontWeight: 700,
              background: "rgba(0,229,160,0.1)", color: "var(--neon)",
              border: "1px solid rgba(0,229,160,0.3)", borderRadius: 5, padding: "1px 7px",
              verticalAlign: "middle",
            }}>Singleton PoolManager</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: "0.1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["Flash Accounting", "ERC-6909", "Hooks", "Lower Gas"].map(f => (
              <span key={f} style={{ color: "var(--neon)", opacity: 0.7 }}>· {f}</span>
            ))}
          </div>
        </div>
        <a
          href="https://docs.uniswap.org/contracts/v4/overview"
          target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: 12, textDecoration: "none", flexShrink: 0 }}
        >
          Docs <ExternalLink size={11} />
        </a>
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── Left column: Token pair + Fee + Hook + Amounts ─── */}
        <div style={{
          flex: "0 0 340px", minWidth: 280,
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>

          {/* Token pair */}
          <Section label="1. Select Pair">
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {(["a", "b"] as const).map(k => {
                const tok = k === "a" ? pos.tokenA : pos.tokenB;
                return (
                  <button
                    key={k}
                    onClick={() => setSelectorTarget(k)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-input)", border: `1px solid ${tok ? "rgba(0,229,160,0.35)" : "var(--border)"}`,
                      borderRadius: 12, cursor: "pointer",
                      color: tok ? "var(--text)" : "var(--text-muted)",
                      fontWeight: tok ? 700 : 400, fontSize: 14,
                      transition: "border-color 0.12s",
                    }}
                  >
                    {tok ? (
                      <>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", background: "var(--bg-card)", flexShrink: 0 }}>
                          {tok.logoURI && <img src={tok.logoURI} alt="" style={{ width: "100%", height: "100%" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                        </div>
                        {tok.symbol}
                      </>
                    ) : `Token ${k.toUpperCase()} ▾`}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Fee tier */}
          <Section label="2. Fee Tier">
            <FeeTierSelector value={pos.fee} onChange={pos.setFee} />
          </Section>

          {/* Hook */}
          <Section label="3. Hook Contract">
            <HookSelector value={pos.hookAddr} onChange={pos.setHookAddr} />
          </Section>

          {/* Deposit amounts */}
          {pos.tokenA && pos.tokenB && pos.poolExists && (
            <Section label="5. Deposit Amounts">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {([
                  { token: pos.tokenA, amount: pos.amountA, onChange: pos.setAmountA },
                  { token: pos.tokenB, amount: pos.amountB, onChange: pos.setAmountB },
                ] as const).map(({ token, amount, onChange }) => (
                  <div key={token.symbol} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    background: "var(--bg-input)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "0.75rem 1rem",
                  }}>
                    <input
                      type="number" placeholder="0.0" value={amount}
                      onChange={e => onChange(e.target.value)}
                      style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--text)", minWidth: 0 }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", background: "var(--bg-card)" }}>
                        {token.logoURI && <img src={token.logoURI} alt="" style={{ width: "100%", height: "100%" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                      </div>
                      {token.symbol}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right column: Init / Range + CTA ─────────────── */}
        <div style={{
          flex: "1 1 340px", minWidth: 280,
          display: "flex", flexDirection: "column", gap: "0.85rem",
        }}>

          {/* Initialize pool panel */}
          {pos.tokenA && pos.tokenB && !pos.poolExists && (
            <div style={{
              padding: "1rem 1.1rem",
              background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: "'Share Tech Mono', monospace" }}>
                4. Initialize Pool
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Puzzle size={14} color="#eab308" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "#eab308", fontWeight: 600, lineHeight: 1.5 }}>
                  This pool hasn't been deployed yet. Set an initial price to initialize it.
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number" placeholder="Initial price (token1 per token0)"
                  value={initPrice} onChange={e => setInitPrice(e.target.value)}
                  style={{
                    flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "0.55rem 0.75rem", color: "var(--text)",
                    fontSize: 13, outline: "none",
                  }}
                />
                <button
                  disabled={!initPrice || pos.isPending}
                  onClick={() => pos.initializePool(parseFloat(initPrice))}
                  style={{
                    padding: "0.55rem 1rem", borderRadius: 10,
                    border: "1px solid rgba(234,179,8,0.4)", background: "rgba(234,179,8,0.12)",
                    color: "#eab308", cursor: initPrice ? "pointer" : "not-allowed",
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {pos.isPending ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Deploy Pool"}
                </button>
              </div>
            </div>
          )}

          {/* Price range */}
          {pos.tokenA && pos.tokenB && pos.poolExists && (
            <Section label="4. Set Price Range">
              <V3RangeSelector
                currentPrice={pos.currentPrice}
                minPrice={pos.minPrice}
                maxPrice={pos.maxPrice}
                onMinChange={pos.setMinPrice}
                onMaxChange={pos.setMaxPrice}
                token0Symbol={pos.token0?.symbol ?? ""}
                token1Symbol={pos.token1?.symbol ?? ""}
              />
            </Section>
          )}

          {/* Placeholder when no pair selected */}
          {(!pos.tokenA || !pos.tokenB) && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "2.5rem 1.5rem", textAlign: "center",
              background: "rgba(0,0,0,0.15)", border: "1px dashed var(--border)",
              borderRadius: 16,
            }}>
              <Zap size={32} color="var(--neon)" style={{ opacity: 0.25, marginBottom: "0.75rem" }} />
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Select a pair to configure<br />your V4 position
              </div>
            </div>
          )}

          {/* Error */}
          {pos.error && (
            <div style={{
              fontSize: 12, color: "#f87171",
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 10, padding: "0.65rem 0.9rem",
            }}>
              {pos.error}
            </div>
          )}

          {/* Tx success */}
          {pos.txHash && !pos.error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem", fontSize: 12,
              color: "var(--neon)",
              background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.25)",
              borderRadius: 10, padding: "0.65rem 0.9rem",
            }}>
              <CheckCircle size={14} />
              Position minted!{" "}
              <a href={`https://etherscan.io/tx/${pos.txHash}`} target="_blank" rel="noreferrer"
                style={{ color: "var(--neon)", textDecoration: "underline" }}>View tx</a>
            </div>
          )}

          {/* CTA */}
          <button
            disabled={!canMint || pos.isPending}
            onClick={handleCta}
            style={{
              width: "100%", padding: "0.9rem", borderRadius: 14, border: "none",
              background: canMint
                ? "linear-gradient(135deg, var(--neon, #00e5a0), #009e78)"
                : "rgba(58,77,102,0.35)",
              color: canMint ? "#001220" : "var(--text-muted)",
              fontWeight: 800, fontSize: 15,
              cursor: canMint ? "pointer" : "not-allowed",
              boxShadow: canMint ? "0 4px 18px rgba(0,229,160,0.3)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              transition: "all 0.15s",
            }}
          >
            {pos.isPending
              ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
              : <><Plus size={16} />{ctaLabel}</>
            }
          </button>
        </div>
      </div>

      {selectorTarget && (
        <TokenSelector
          onSelect={t => { if (selectorTarget === "a") pos.setTokenA(t); else pos.setTokenB(t); setSelectorTarget(null); }}
          exclude={selectorTarget === "a" ? pos.tokenB : pos.tokenA}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reusable labeled section wrapper ────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(11,21,39,0.7)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "1rem 1.1rem",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
        color: "var(--text-muted)", textTransform: "uppercase",
        marginBottom: "0.75rem",
        fontFamily: "'Share Tech Mono', monospace",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
