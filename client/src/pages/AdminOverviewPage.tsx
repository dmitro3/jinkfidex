import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Trophy, Coins, TrendingUp, ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";
import { questApi, stakingApi, perpsApi, type QuestSubmission, type StakingSubmission, type PerpsSubmission } from "../api/client";

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "#eab308",
  APPROVED: "var(--accent)",
  REJECTED: "#f87171",
};

function trunc(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, onClick }: {
  label: string; value: number; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, padding: "0.9rem 1.1rem",
        background: "var(--bg-card)", border: `1px solid ${color}33`,
        borderLeft: `3px solid ${color}`,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.12s",
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = color; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = `${color}33`; }}
    >
      <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "'Rajdhani', sans-serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.12em", marginTop: "0.2rem" }}>
        {label}
      </div>
    </div>
  );
}

// ── Module section ────────────────────────────────────────────────────────────

function ModuleHeader({ icon, title, route, pending }: {
  icon: React.ReactNode; title: string; route: string; pending: number;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
      {icon}
      <span style={{ fontWeight: 900, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>{title}</span>
      {pending > 0 && (
        <span style={{
          fontSize: 9, fontWeight: 800, background: "#eab30820", color: "#eab308",
          border: "1px solid #eab308", padding: "1px 6px",
          fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em",
        }}>
          {pending} PENDING
        </span>
      )}
      <button
        onClick={() => navigate(route)}
        style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem",
          background: "none", border: "1px solid var(--border)", padding: "0.2rem 0.6rem",
          color: "var(--text-muted)", cursor: "pointer", fontSize: 10,
          fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em",
        }}
      >
        MANAGE <ExternalLink size={9} />
      </button>
    </div>
  );
}

// ── Recent submission row ─────────────────────────────────────────────────────

function SubRow({ label, submitter, status, date }: {
  label: string; submitter: string; status: string; date: string;
}) {
  const icon = status === "APPROVED"
    ? <CheckCircle2 size={11} color={STATUS_COLOR.APPROVED} />
    : status === "REJECTED"
      ? <XCircle size={11} color={STATUS_COLOR.REJECTED} />
      : <Clock size={11} color={STATUS_COLOR.PENDING} />;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.45rem 0.75rem",
      background: "var(--bg-input)", fontSize: 12,
    }}>
      {icon}
      <span style={{ flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", flexShrink: 0 }}>
        {trunc(submitter)}
      </span>
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
        color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}`,
        padding: "1px 5px", fontFamily: "'Share Tech Mono', monospace", flexShrink: 0,
      }}>
        {status}
      </span>
      <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, fontFamily: "'Share Tech Mono', monospace" }}>
        {new Date(date).toLocaleDateString()}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { isConnected } = useAccount();

  const { data: quests = []  } = useQuery({ queryKey: ["admin-submissions", "ALL"],          queryFn: () => questApi.listSubmissions(),   retry: false });
  const { data: staking = [] } = useQuery({ queryKey: ["admin-staking-submissions", "ALL"],  queryFn: () => stakingApi.listSubmissions(),  retry: false });
  const { data: perps = []   } = useQuery({ queryKey: ["admin-perps-submissions", "ALL"],    queryFn: () => perpsApi.listSubmissions(),    retry: false });

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 600, margin: "6rem auto", textAlign: "center", padding: "0 1.5rem" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.14em" }}>
          CONNECT ADMIN WALLET
        </div>
      </div>
    );
  }

  const questList   = quests  as QuestSubmission[];
  const stakingList = staking as StakingSubmission[];
  const perpsList   = perps   as PerpsSubmission[];

  const count = (list: { status: string }[], s: string) => list.filter(x => x.status === s).length;

  const totalPending  = count(questList, "PENDING")  + count(stakingList, "PENDING")  + count(perpsList, "PENDING");
  const totalApproved = count(questList, "APPROVED") + count(stakingList, "APPROVED") + count(perpsList, "APPROVED");
  const totalRejected = count(questList, "REJECTED") + count(stakingList, "REJECTED") + count(perpsList, "REJECTED");
  const totalAll      = questList.length + stakingList.length + perpsList.length;

  const recent5 = [
    ...questList.map(s => ({ label: (s as QuestSubmission).title, submitter: s.submitterAddress, status: s.status, date: s.createdAt, module: "QUEST" })),
    ...stakingList.map(s => ({ label: `${(s as StakingSubmission).tokenSymbol} / ${(s as StakingSubmission).rewardTokenSymbol} — ${s.projectName}`, submitter: s.submitterAddress, status: s.status, date: s.createdAt, module: "STAKING" })),
    ...perpsList.map(s => ({ label: `${(s as PerpsSubmission).tokenSymbol}/${(s as PerpsSubmission).quoteAsset} — ${s.projectName}`, submitter: s.submitterAddress, status: s.status, date: s.createdAt, module: "PERPS" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 2, height: 22, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
          <h1 style={{ fontWeight: 900, fontSize: 22, margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>
            ADMIN OVERVIEW
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
          Platform-wide submission status across all modules
        </p>
      </div>

      {/* Top stats */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <StatCard label="TOTAL SUBMISSIONS" value={totalAll}      color="var(--text-muted)" />
        <StatCard label="PENDING REVIEW"    value={totalPending}  color="#eab308" />
        <StatCard label="APPROVED"          value={totalApproved} color="var(--accent)" />
        <StatCard label="REJECTED"          value={totalRejected} color="#f87171" />
      </div>

      {/* Module breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>

        {/* Quests */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "1.1rem" }}>
          <ModuleHeader
            icon={<Trophy size={14} color="#eab308" />}
            title="QUESTS"
            route="/admin/quests"
            pending={count(questList, "PENDING")}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: "0.4rem", background: "var(--bg-input)", border: `1px solid ${STATUS_COLOR[s]}22` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: STATUS_COLOR[s], fontFamily: "'Rajdhani', sans-serif" }}>
                  {count(questList, s)}
                </div>
                <div style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staking */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "1.1rem" }}>
          <ModuleHeader
            icon={<Coins size={14} color="var(--accent)" />}
            title="STAKING"
            route="/admin/staking"
            pending={count(stakingList, "PENDING")}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: "0.4rem", background: "var(--bg-input)", border: `1px solid ${STATUS_COLOR[s]}22` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: STATUS_COLOR[s], fontFamily: "'Rajdhani', sans-serif" }}>
                  {count(stakingList, s)}
                </div>
                <div style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Perps */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "1.1rem" }}>
          <ModuleHeader
            icon={<TrendingUp size={14} color="#a78bfa" />}
            title="PERPS"
            route="/admin/perps"
            pending={count(perpsList, "PENDING")}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["PENDING", "APPROVED", "REJECTED"] as const).map(s => (
              <div key={s} style={{ flex: 1, textAlign: "center", padding: "0.4rem", background: "var(--bg-input)", border: `1px solid ${STATUS_COLOR[s]}22` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: STATUS_COLOR[s], fontFamily: "'Rajdhani', sans-serif" }}>
                  {count(perpsList, s)}
                </div>
                <div style={{ fontSize: 8, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.75rem" }}>
          RECENT ACTIVITY
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {recent5.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
              NO ACTIVITY YET
            </div>
          )}
          {recent5.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: "0.1em", flexShrink: 0,
                color: item.module === "QUEST" ? "#eab308" : item.module === "STAKING" ? "var(--accent)" : "#a78bfa",
                border: `1px solid ${item.module === "QUEST" ? "#eab308" : item.module === "STAKING" ? "var(--accent)" : "#a78bfa"}`,
                padding: "1px 5px", fontFamily: "'Share Tech Mono', monospace", width: 52, textAlign: "center",
              }}>
                {item.module}
              </span>
              <div style={{ flex: 1 }}>
                <SubRow label={item.label} submitter={item.submitter} status={item.status} date={item.date} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
