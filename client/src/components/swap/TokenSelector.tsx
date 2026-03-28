import { useState } from "react";
import { X, Search } from "lucide-react";
import { DEFAULT_TOKENS, type Token } from "../../lib/tokens";

interface Props {
  onSelect: (token: Token) => void;
  exclude?: Token | null;
  onClose: () => void;
}

export default function TokenSelector({ onSelect, exclude, onClose }: Props) {
  const [query, setQuery] = useState("");

  const filtered = DEFAULT_TOKENS.filter(t =>
    t.address !== exclude?.address &&
    (t.symbol.toLowerCase().includes(query.toLowerCase()) || t.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, width: 380, maxHeight: 520, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Select Token</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "0.75rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.5rem 0.75rem" }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              autoFocus
              placeholder="Search token name or symbol"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 14, flex: 1 }}
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "0 0.5rem 0.75rem" }}>
          {filtered.map(token => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.65rem 0.75rem", borderRadius: 10, border: "none", background: "transparent", color: "var(--text)", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-input)", border: "1px solid var(--border)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {token.logoURI ? (
                  <img src={token.logoURI} alt={token.symbol} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : token.symbol.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{token.symbol}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{token.name}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem", fontSize: 14 }}>No tokens found</div>
          )}
        </div>
      </div>
    </div>
  );
}
