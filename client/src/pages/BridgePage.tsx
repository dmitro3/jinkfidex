import { useState } from "react";
import { ArrowDownUp, ChevronDown, Info, Zap } from "lucide-react";
import { useAccount } from "wagmi";

const CHAINS = [
  { id: 1,        name: "Ethereum",      short: "ETH",   color: "#627EEA", symbol: "ETH"  },
  { id: 8453,     name: "Base",          short: "BASE",  color: "#0052FF", symbol: "ETH"  },
  { id: 42161,    name: "Arbitrum",      short: "ARB",   color: "#28A0F0", symbol: "ETH"  },
  { id: 137,      name: "Polygon",       short: "POL",   color: "#8247E5", symbol: "POL"  },
  { id: 10,       name: "Optimism",      short: "OP",    color: "#FF0420", symbol: "ETH"  },
  { id: 56,       name: "BNB Chain",     short: "BNB",   color: "#F0B90B", symbol: "BNB"  },
  { id: 999,      name: "HyperEVM",      short: "HYPE",  color: "#00ff94", symbol: "HYPE" },
  { id: 6342,     name: "MegaETH",       short: "MEGA",  color: "#FF6B35", symbol: "ETH"  },
  { id: 10143,    name: "Monad Testnet", short: "MON",   color: "#836EF9", symbol: "MON"  },
  { id: 361,      name: "Plasma",        short: "PLSM",  color: "#7C3AED", symbol: "PLSM" },
  { id: 4217,     name: "Tempo",         short: "TEMPO", color: "#0EA5E9", symbol: "USD"  },
];

const TOKENS = ["ETH", "USDC", "USDT", "WBTC", "DAI", "LINK", "UNI"];

type Chain = typeof CHAINS[number];

function ChainDropdown({ value, onChange, exclude }: { value: Chain; onChange: (c: Chain) => void; exclude?: Chain }) {
  const [open, setOpen] = useState(false);
  const available = CHAINS.filter(c => c.id !== exclude?.id);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.55rem 0.8rem",
          background: "var(--bg-input)",
          border: `1px solid ${open ? value.color : "var(--border)"}`,
          color: "var(--text)", cursor: "pointer", width: "100%",
          boxShadow: open ? `0 0 12px ${value.color}44` : "none",
          transition: "all 0.12s",
        }}
      >
        <div style={{ width: 8, height: 8, background: value.color, boxShadow: `0 0 6px ${value.color}`, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 700 }}>{value.name}</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{value.short}</span>
        <ChevronDown size={12} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "rgba(4,8,18,0.99)",
          border: "1px solid var(--border)",
          borderTop: `1px solid var(--accent)`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          animation: "fadeIn 0.12s ease",
          maxHeight: 280, overflowY: "auto",
        }}>
          {available.map(c => (
            <button
              key={c.id}
              onClick={() => { onChange(c); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.55rem 0.75rem",
                background: value.id === c.id ? `${c.color}12` : "transparent",
                border: "none",
                borderLeft: `3px solid ${value.id === c.id ? c.color : "transparent"}`,
                color: value.id === c.id ? c.color : "var(--text-muted)",
                cursor: "pointer", textAlign: "left",
                fontSize: 12, fontWeight: value.id === c.id ? 700 : 500,
                transition: "all 0.1s",
              }}
              onMouseEnter={e => { if (value.id !== c.id) { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "var(--text)"; } }}
              onMouseLeave={e => { if (value.id !== c.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; } }}
            >
              <div style={{ width: 7, height: 7, background: c.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{c.name}</span>
              <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace" }}>{c.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TokenDropdown({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.35rem 0.65rem",
          background: "rgba(202,228,219,0.08)",
          border: "1px solid var(--border-bright)",
          color: "var(--accent)", cursor: "pointer",
          fontSize: 12, fontWeight: 800, letterSpacing: "0.04em",
          fontFamily: "'Share Tech Mono', monospace",
          transition: "all 0.12s",
        }}
      >
        {value}
        <ChevronDown size={10} style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
          background: "rgba(4,8,18,0.99)",
          border: "1px solid var(--border)",
          borderTop: "1px solid var(--accent)",
          minWidth: 100,
          animation: "fadeIn 0.12s ease",
          boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
        }}>
          {TOKENS.map(t => (
            <button
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              style={{
                width: "100%", padding: "0.45rem 0.75rem",
                background: value === t ? "rgba(202,228,219,0.08)" : "transparent",
                border: "none",
                borderLeft: `3px solid ${value === t ? "var(--accent)" : "transparent"}`,
                color: value === t ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer", textAlign: "left",
                fontSize: 12, fontWeight: value === t ? 700 : 500,
                fontFamily: "'Share Tech Mono', monospace",
                transition: "all 0.1s",
              }}
              onMouseEnter={e => { if (value !== t) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
              onMouseLeave={e => { if (value !== t) { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; } }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BridgePage() {
  const { isConnected } = useAccount();
  const [fromChain, setFromChain] = useState(CHAINS[0]);
  const [toChain,   setToChain]   = useState(CHAINS[2]);
  const [token,     setToken]     = useState("ETH");
  const [amount,    setAmount]    = useState("");

  const flip = () => {
    const tmp = fromChain;
    setFromChain(toChain);
    setToChain(tmp);
  };

  // Simulated receive estimate
  const receiveEst = amount && !isNaN(parseFloat(amount))
    ? (parseFloat(amount) * 0.9985).toFixed(6)
    : "";

  const fee = amount && !isNaN(parseFloat(amount))
    ? (parseFloat(amount) * 0.0015).toFixed(6)
    : "—";

  const canBridge = isConnected && !!amount && parseFloat(amount) > 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{
          fontWeight: 900, fontSize: 26, marginBottom: "0.2rem",
          letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif",
        }}>BRIDGE</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'Share Tech Mono', monospace" }}>
          Transfer assets across chains · ~60s avg · 0.15% fee
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: "rgba(4,8,18,0.97)",
        border: "1px solid var(--border)",
        borderTop: "1px solid var(--border-bright)",
        position: "relative",
        clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
        padding: "1.25rem",
        animation: "fadeIn 0.3s ease",
      }}>
        {/* Cut-corner accent */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 16, height: 16,
          borderTop: "1px solid var(--accent)",
          borderRight: "1px solid var(--accent)",
          boxShadow: "2px -2px 8px var(--accent-glow)",
          pointerEvents: "none",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.1rem" }}>
          <Zap size={13} color="var(--accent)" />
          <span style={{
            fontWeight: 900, fontSize: 13, letterSpacing: "0.14em",
            fontFamily: "'Rajdhani', sans-serif",
          }}>CROSS-CHAIN TRANSFER</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 5, height: 5, background: "var(--accent)", animation: "punkPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, color: "var(--accent)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* FROM */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.35rem" }}>FROM</div>
          <ChainDropdown value={fromChain} onChange={setFromChain} exclude={toChain} />
        </div>

        {/* Amount input */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "var(--bg-input)", border: "1px solid var(--border)",
          borderLeft: `2px solid ${fromChain.color}`,
          padding: "0.75rem 0.85rem", marginBottom: "0.35rem",
        }}>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 28, fontWeight: 700, color: "var(--text)", minWidth: 0,
              fontFamily: "'Share Tech Mono', monospace",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
            <TokenDropdown value={token} onChange={setToken} />
            <button
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.08em",
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Flip button */}
        <div style={{ display: "flex", justifyContent: "center", margin: "0.6rem 0" }}>
          <button
            onClick={flip}
            style={{
              background: "var(--bg-deep)", border: "1px solid var(--border)",
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--text-muted)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 10px var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <ArrowDownUp size={13} />
          </button>
        </div>

        {/* TO */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.35rem" }}>TO</div>
          <ChainDropdown value={toChain} onChange={setToChain} exclude={fromChain} />
        </div>

        {/* You receive */}
        <div style={{
          background: "var(--bg-input)", border: "1px solid var(--border)",
          borderLeft: `2px solid ${toChain.color}`,
          padding: "0.75rem 0.85rem", marginBottom: "1rem",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.3rem" }}>YOU RECEIVE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: receiveEst ? "var(--accent)" : "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>
            {receiveEst || "0.000000"}
            <span style={{ fontSize: 14, marginLeft: "0.4rem", color: "var(--text-muted)" }}>{token}</span>
          </div>
        </div>

        {/* Route summary */}
        {amount && parseFloat(amount) > 0 && (
          <div style={{
            borderLeft: "2px solid var(--border)",
            padding: "0.5rem 0.75rem", marginBottom: "1rem",
            background: "rgba(0,0,0,0.2)",
          }}>
            {[
              { label: "BRIDGE FEE", value: `${fee} ${token}` },
              { label: "EST. TIME",  value: "~45–90 sec" },
              { label: "ROUTE",      value: `${fromChain.short} → ${toChain.short}` },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em" }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: "var(--text)", fontFamily: "'Share Tech Mono', monospace" }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warning */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "0.5rem",
          borderLeft: "2px solid rgba(255,45,107,0.4)",
          padding: "0.45rem 0.65rem", marginBottom: "0.85rem",
          fontSize: 11, color: "var(--text-muted)",
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <Info size={11} style={{ flexShrink: 0, marginTop: 1, color: "var(--punk)" }} />
          Always verify destination address. Cross-chain transfers are irreversible.
        </div>

        {/* CTA */}
        <button
          disabled={!canBridge}
          style={{
            width: "100%", padding: "0.9rem",
            border: `1px solid ${canBridge ? "var(--accent)" : "var(--border)"}`,
            background: canBridge ? "var(--accent)" : "transparent",
            color: canBridge ? "var(--bg-deep)" : "var(--text-muted)",
            fontWeight: 900, fontSize: 13, letterSpacing: "0.1em",
            cursor: canBridge ? "pointer" : "not-allowed",
            boxShadow: canBridge ? "0 0 24px var(--accent-glow)" : "none",
            transition: "all 0.15s",
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          {!isConnected ? "CONNECT WALLET" : !amount || parseFloat(amount) <= 0 ? "ENTER AMOUNT" : `BRIDGE ${token} · ${fromChain.short} → ${toChain.short}`}
        </button>
      </div>

      {/* Supported chains */}
      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.6rem" }}>
          SUPPORTED NETWORKS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {CHAINS.map(c => (
            <div
              key={c.id}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.3rem 0.6rem",
                border: "1px solid var(--border)",
                fontSize: 10, color: "var(--text-muted)",
                fontFamily: "'Share Tech Mono', monospace",
                background: fromChain.id === c.id || toChain.id === c.id ? `${c.color}12` : "transparent",
                borderColor: fromChain.id === c.id || toChain.id === c.id ? c.color : "var(--border)",
                transition: "all 0.12s",
              }}
            >
              <div style={{ width: 5, height: 5, background: c.color }} />
              {c.short}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
