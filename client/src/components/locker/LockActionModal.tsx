import { useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { type Lock } from "../../api/client";
import { useLocker } from "../../hooks/useLocker";

interface Props {
  lock: Lock;
  onClose: () => void;
  onUpdated: () => void;
}

type Tab = "withdraw" | "extend" | "transfer";

export default function LockActionModal({ lock, onClose, onUpdated }: Props) {
  const [tab, setTab]       = useState<Tab>("withdraw");
  const [newDate, setNewDate] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { withdrawLock, extendLock, transferLock } = useLocker();

  const isUnlocked    = new Date(lock.unlockDate) <= new Date();
  const lockerAddress = lock.contractAddress as `0x${string}` | undefined;
  const hasContract   = !!lockerAddress;

  async function run(fn: () => Promise<`0x${string}`>) {
    setIsPending(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await fn();
      setTxHash(hash);
      onUpdated();
      setTimeout(onClose, 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setIsPending(false);
    }
  }

  const handleWithdraw = () => run(() => withdrawLock(lockerAddress!));

  const handleExtend = () => {
    const newTimeSecs = Math.floor(new Date(newDate).getTime() / 1000);
    return run(() => extendLock(lockerAddress!, newTimeSecs));
  };

  const handleTransfer = () => run(() =>
    transferLock(lockerAddress!, newOwner as `0x${string}`)
  );

  const tabs: Tab[] = isUnlocked ? ["withdraw"] : ["extend", "transfer"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, width: 440, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Manage Lock #{lock.id.slice(-6)}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "0.75rem", border: "none", background: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 14, textTransform: "capitalize",
              color: tab === t ? "var(--text)" : "var(--text-muted)",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Lock summary */}
          <div style={{ background: "var(--bg-input)", borderRadius: 12, padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: 13 }}>
            <div><span style={{ color: "var(--text-muted)" }}>Token: </span>{lock.tokenSymbol ?? lock.tokenAddress.slice(0, 8)}</div>
            <div><span style={{ color: "var(--text-muted)" }}>Amount: </span>{parseFloat(lock.amount).toLocaleString()}</div>
            <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--text-muted)" }}>Unlock: </span>{new Date(lock.unlockDate).toLocaleString()}</div>
            {lockerAddress && (
              <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                Contract: {lockerAddress.slice(0, 10)}…{lockerAddress.slice(-6)}
              </div>
            )}
          </div>

          {!hasContract && (
            <div style={{ fontSize: 13, color: "#f97316", marginBottom: "1rem", display: "flex", gap: "0.4rem" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              No contract address — this lock was not created on-chain or is a legacy record.
            </div>
          )}

          {/* Withdraw */}
          {tab === "withdraw" && (
            <>
              {!isUnlocked && (
                <div style={{ fontSize: 13, color: "#f97316", marginBottom: "0.75rem", display: "flex", gap: "0.4rem" }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  Lock has not expired yet.
                </div>
              )}
              <button
                onClick={handleWithdraw}
                disabled={!isUnlocked || isPending || !hasContract}
                style={{ ...btnStyle, opacity: (!isUnlocked || !hasContract) ? 0.4 : 1, cursor: (!isUnlocked || !hasContract) ? "not-allowed" : "pointer" }}
              >
                {isPending ? "Waiting for wallet…" : "Withdraw Tokens"}
              </button>
            </>
          )}

          {/* Extend */}
          {tab === "extend" && (
            <>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                New unlock date (must be later than current)
              </div>
              <input
                type="datetime-local"
                value={newDate}
                min={new Date(new Date(lock.unlockDate).getTime() + 60000).toISOString().slice(0, 16)}
                onChange={e => setNewDate(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleExtend}
                disabled={!newDate || isPending || !hasContract}
                style={{ ...btnStyle, marginTop: "1rem", opacity: (!newDate || !hasContract) ? 0.5 : 1 }}
              >
                {isPending ? "Waiting for wallet…" : "Extend Lock"}
              </button>
            </>
          )}

          {/* Transfer */}
          {tab === "transfer" && (
            <>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                New owner address
              </div>
              <input
                placeholder="0x..."
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleTransfer}
                disabled={!newOwner.startsWith("0x") || isPending || !hasContract}
                style={{ ...btnStyle, marginTop: "1rem", opacity: (!newOwner || !hasContract) ? 0.5 : 1 }}
              >
                {isPending ? "Waiting for wallet…" : "Transfer Ownership"}
              </button>
            </>
          )}

          {/* Tx hash */}
          {txHash && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", fontSize: 13, color: "#4ade80" }}>
              <CheckCircle2 size={15} />
              Submitted!{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank" rel="noreferrer"
                style={{ color: "#4ade80", textDecoration: "underline" }}
              >
                View on Etherscan
              </a>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", fontSize: 13, color: "#f87171", marginTop: "0.75rem" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: "100%", padding: "0.85rem", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, var(--accent), #009e78)",
  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: 10, padding: "0.6rem 0.85rem", color: "var(--text)",
  fontSize: 13, outline: "none", boxSizing: "border-box",
};
