import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { perpsApi, type PerpsSubmission } from "../api/client";

const STATUS_FILTER = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Filter = typeof STATUS_FILTER[number];

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "#eab308",
  APPROVED: "var(--accent)",
  REJECTED: "#f87171",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 8453: "Base", 42161: "Arbitrum",
  137: "Polygon", 10: "Optimism", 56: "BSC",
  10143: "Monad", 999: "HyperEVM",
};

const ORACLE_COLOR: Record<string, string> = {
  chainlink: "#3b82f6",
  pyth:      "#a78bfa",
  custom:    "#f59e0b",
};

function trunc(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }
function fmtBps(n: number) { return `${(n / 100).toFixed(2)}%`; }

function InfoRow({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.3rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{label}</span>
      <span style={{ fontSize: 11, color: "var(--text)", fontFamily: mono ? "'Share Tech Mono', monospace" : "inherit" }}>{value}</span>
    </div>
  );
}

export default function AdminPerpsPage() {
  const { isConnected } = useAccount();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-perps-submissions", filter],
    queryFn: () => perpsApi.listSubmissions(filter === "ALL" ? undefined : filter),
    retry: false,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => perpsApi.approveSubmission(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-perps-submissions"] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => perpsApi.rejectSubmission(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-perps-submissions"] }),
  });

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 600, margin: "6rem auto", textAlign: "center", padding: "0 1.5rem" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.14em" }}>
          CONNECT ADMIN WALLET
        </div>
      </div>
    );
  }

  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  (submissions as PerpsSubmission[]).forEach(s => {
    if (s.status in counts) counts[s.status as keyof typeof counts]++;
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 2, height: 22, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
          <h1 style={{ fontWeight: 900, fontSize: 22, margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>
            PERPS SUBMISSIONS
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
          Admin panel — review, approve, or reject third-party perpetuals market submissions
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => (
          <div key={s} style={{
            flex: 1, padding: "0.6rem 0.9rem",
            background: "var(--bg-card)", border: `1px solid ${STATUS_COLOR[s]}22`,
            borderLeft: `3px solid ${STATUS_COLOR[s]}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: STATUS_COLOR[s], fontFamily: "'Rajdhani', sans-serif" }}>
              {counts[s]}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.12em" }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
        {STATUS_FILTER.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "0.35rem 0.9rem", height: 30,
              background: filter === f ? "var(--accent)" : "transparent",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
              color: filter === f ? "var(--bg-deep)" : "var(--text-muted)",
              cursor: "pointer", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.12em", fontFamily: "'Share Tech Mono', monospace",
              transition: "all 0.12s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
          LOADING…
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>
          NO SUBMISSIONS
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {(submissions as PerpsSubmission[]).map(sub => {
          const isExpanded = expanded === sub.id;

          return (
            <div key={sub.id} style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderLeft: `3px solid ${STATUS_COLOR[sub.status] ?? "var(--border)"}`,
            }}>
              {/* Row header */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : sub.id)}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: "var(--bg-input)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrendingUp size={16} color="var(--accent)" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", marginBottom: "0.15rem" }}>
                    {sub.tokenSymbol}/{sub.quoteAsset}
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginLeft: "0.5rem" }}>{sub.projectName}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <span>by {trunc(sub.submitterAddress)}</span>
                    <span>{CHAIN_NAMES[sub.chainId] ?? `Chain ${sub.chainId}`}</span>
                    <span>up to {sub.maxLeverage}x</span>
                    <span style={{ color: ORACLE_COLOR[sub.oracleType] ?? "var(--text-muted)" }}>{sub.oracleType} oracle</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Payment tx */}
                <a
                  href={`https://etherscan.io/tx/${sub.paymentTxHash}`}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: 10, color: "var(--text-muted)", textDecoration: "none", fontFamily: "'Share Tech Mono', monospace", flexShrink: 0 }}
                >
                  0.05 ETH <ExternalLink size={10} />
                </a>

                {/* Status badge */}
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", flexShrink: 0,
                  color: STATUS_COLOR[sub.status], border: `1px solid ${STATUS_COLOR[sub.status]}`,
                  padding: "2px 8px", fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {sub.status}
                </span>

                {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "1.25rem" }}>

                    {/* Token info */}
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>TOKEN</div>
                      <InfoRow label="ADDRESS" value={trunc(sub.tokenAddress)} />
                      <InfoRow label="SYMBOL" value={sub.tokenSymbol} />
                      <InfoRow label="NAME" value={sub.tokenName} mono={false} />
                      <InfoRow label="QUOTE" value={sub.quoteAsset} />
                      <InfoRow label="CHAIN" value={CHAIN_NAMES[sub.chainId] ?? `Chain ${sub.chainId}`} mono={false} />
                    </div>

                    {/* Oracle & fees */}
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>ORACLE & FEES</div>
                      <InfoRow label="ORACLE TYPE" value={sub.oracleType} />
                      {sub.oracleAddress && <InfoRow label="ORACLE ADDR" value={trunc(sub.oracleAddress)} />}
                      <InfoRow label="TRADING FEE" value={fmtBps(sub.tradingFeeBps)} />
                      <InfoRow label="LIQ FEE" value={fmtBps(sub.liquidationFeeBps)} />
                    </div>

                    {/* Risk parameters */}
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>RISK PARAMS</div>
                      <InfoRow label="MAX LEVERAGE" value={`${sub.maxLeverage}x`} />
                      <InfoRow label="INIT MARGIN" value={fmtBps(sub.initialMarginBps)} />
                      <InfoRow label="MAINT MARGIN" value={fmtBps(sub.maintenanceMarginBps)} />
                      <InfoRow label="MAX OI LONG" value={sub.maxOILong} />
                      <InfoRow label="MAX OI SHORT" value={sub.maxOIShort} />
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>DESCRIPTION</div>
                    <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7, margin: 0, padding: "0.6rem 0.75rem", background: "var(--bg-input)" }}>
                      {sub.description}
                    </p>
                  </div>

                  {/* Project links */}
                  {sub.projectUrl && (
                    <div style={{ marginBottom: "1rem" }}>
                      <a href={sub.projectUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Share Tech Mono', monospace", display: "inline-flex", alignItems: "center", gap: "0.3rem", textDecoration: "none" }}
                      >
                        {sub.projectUrl} <ExternalLink size={10} />
                      </a>
                    </div>
                  )}

                  {/* Admin note input */}
                  {sub.status === "PENDING" && (
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ display: "block", fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>
                        ADMIN NOTE (optional)
                      </label>
                      <textarea
                        value={notes[sub.id] ?? ""}
                        onChange={e => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        rows={2}
                        placeholder="Reason for approval/rejection…"
                        style={{
                          width: "100%", boxSizing: "border-box",
                          background: "var(--bg-input)", border: "1px solid var(--border)",
                          padding: "0.5rem 0.75rem", color: "var(--text)", fontSize: 12,
                          outline: "none", resize: "vertical", fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}

                  {/* Existing admin note */}
                  {sub.adminNote && sub.status !== "PENDING" && (
                    <div style={{ marginBottom: "1rem", padding: "0.5rem 0.75rem", background: "var(--bg-input)", border: `1px solid ${STATUS_COLOR[sub.status]}`, fontSize: 12, color: "var(--text-muted)" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "'Share Tech Mono', monospace", color: STATUS_COLOR[sub.status], marginRight: "0.5rem" }}>NOTE:</span>
                      {sub.adminNote}
                    </div>
                  )}

                  {/* Actions */}
                  {sub.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <button
                        onClick={() => approveMut.mutate({ id: sub.id, note: notes[sub.id] })}
                        disabled={approveMut.isPending || rejectMut.isPending}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.5rem 1.25rem",
                          background: "var(--accent)", border: "none",
                          color: "var(--bg-deep)", cursor: "pointer",
                          fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
                          fontFamily: "'Share Tech Mono', monospace",
                          boxShadow: "0 0 12px var(--accent-glow)",
                          opacity: approveMut.isPending ? 0.6 : 1,
                          transition: "all 0.12s",
                        }}
                      >
                        <CheckCircle2 size={13} /> APPROVE
                      </button>
                      <button
                        onClick={() => rejectMut.mutate({ id: sub.id, note: notes[sub.id] })}
                        disabled={approveMut.isPending || rejectMut.isPending}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.5rem 1.25rem",
                          background: "transparent", border: "1px solid #f87171",
                          color: "#f87171", cursor: "pointer",
                          fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
                          fontFamily: "'Share Tech Mono', monospace",
                          opacity: rejectMut.isPending ? 0.6 : 1,
                          transition: "all 0.12s",
                        }}
                      >
                        <XCircle size={13} /> REJECT
                      </button>
                      {(approveMut.isPending || rejectMut.isPending) && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={10} /> PROCESSING…
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
