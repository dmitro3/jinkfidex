import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { questApi, type QuestSubmission } from "../api/client";

const STATUS_FILTER = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Filter = typeof STATUS_FILTER[number];

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "#eab308",
  APPROVED: "var(--accent)",
  REJECTED: "#f87171",
};

function trunc(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

export default function AdminQuestsPage() {
  const { isConnected } = useAccount();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-submissions", filter],
    queryFn: () => questApi.listSubmissions(filter === "ALL" ? undefined : filter),
    retry: false,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => questApi.approveSubmission(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-submissions"] }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => questApi.rejectSubmission(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-submissions"] }),
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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 2, height: 22, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
          <h1 style={{ fontWeight: 900, fontSize: 22, margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>
            QUEST SUBMISSIONS
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
          Admin panel — review, approve, or reject third-party quest submissions
        </p>
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
        {submissions.map((sub: QuestSubmission) => {
          const isExpanded = expanded === sub.id;
          const tasks  = sub.tasksJson  as Array<Record<string, unknown>>;
          const rewards = sub.rewardsJson as Array<Record<string, unknown>>;

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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", marginBottom: "0.2rem" }}>
                    {sub.title}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", display: "flex", gap: "1rem" }}>
                    <span>{sub.projectName}</span>
                    <span>by {trunc(sub.submitterAddress)}</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    <span>{tasks?.length ?? 0} tasks</span>
                  </div>
                </div>

                {/* Payment tx */}
                <a
                  href={`https://etherscan.io/tx/${sub.paymentTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: 10, color: "var(--text-muted)", textDecoration: "none", fontFamily: "'Share Tech Mono', monospace" }}
                >
                  0.05 ETH <ExternalLink size={10} />
                </a>

                {/* Status badge */}
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
                  color: STATUS_COLOR[sub.status], border: `1px solid ${STATUS_COLOR[sub.status]}`,
                  padding: "2px 8px", fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {sub.status}
                </span>

                {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>DESCRIPTION</div>
                      <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{sub.description}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>DETAILS</div>
                      <div style={{ fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: "var(--text)", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span>Start: {new Date(sub.startDate).toLocaleString()}</span>
                        <span>End: {new Date(sub.endDate).toLocaleString()}</span>
                        {sub.projectUrl && <a href={sub.projectUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{sub.projectUrl}</a>}
                        {sub.tags.length > 0 && <span>Tags: {sub.tags.join(", ")}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Tasks preview */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>TASKS ({tasks?.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {tasks?.map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.4rem 0.75rem", background: "var(--bg-input)", fontSize: 11 }}>
                          <span style={{ color: "var(--accent)", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, width: 70, flexShrink: 0 }}>{String(t.type).toUpperCase()}</span>
                          <span style={{ flex: 1 }}>{String(t.title)}</span>
                          <span style={{ color: "var(--accent)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 800 }}>+{String(t.points)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards preview */}
                  {rewards?.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>REWARDS</div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {rewards.map((r, i) => (
                          <div key={i} style={{ padding: "0.35rem 0.75rem", background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 11 }}>
                            {String(r.label)} {r.symbol ? `(${r.symbol})` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin note */}
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

                  {/* Approved quest link */}
                  {sub.status === "APPROVED" && sub.questId && (
                    <a href={`/quests/${sub.questId}`} style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'Share Tech Mono', monospace", display: "inline-flex", alignItems: "center", gap: "0.3rem", marginBottom: "1rem", textDecoration: "none" }}>
                      VIEW LIVE QUEST <ExternalLink size={10} />
                    </a>
                  )}

                  {/* Actions */}
                  {sub.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => approveMut.mutate({ id: sub.id, note: notes[sub.id] })}
                        disabled={approveMut.isPending}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.5rem 1.25rem",
                          background: "var(--accent)", border: "none",
                          color: "var(--bg-deep)", cursor: "pointer",
                          fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
                          fontFamily: "'Share Tech Mono', monospace",
                          boxShadow: "0 0 12px var(--accent-glow)",
                          transition: "all 0.12s",
                        }}
                      >
                        <CheckCircle2 size={13} /> APPROVE
                      </button>
                      <button
                        onClick={() => rejectMut.mutate({ id: sub.id, note: notes[sub.id] })}
                        disabled={rejectMut.isPending}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.5rem 1.25rem",
                          background: "transparent", border: "1px solid #f87171",
                          color: "#f87171", cursor: "pointer",
                          fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
                          fontFamily: "'Share Tech Mono', monospace",
                          transition: "all 0.12s",
                        }}
                      >
                        <XCircle size={13} /> REJECT
                      </button>
                    </div>
                  )}

                  {/* Processing state */}
                  {(approveMut.isPending || rejectMut.isPending) && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.5rem" }}>
                      <Clock size={10} style={{ display: "inline", marginRight: "0.3rem" }} />
                      PROCESSING…
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
