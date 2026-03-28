import { useAccount } from "wagmi";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "../../api/client";

interface Props {
  entries: LeaderboardEntry[];
}

const RANK_COLOR = ["#eab308", "#94a3b8", "#cd7c2f"];

export default function Leaderboard({ entries }: Props) {
  const { address } = useAccount();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Trophy size={13} color="var(--accent)" />
        <span style={{
          fontWeight: 800, fontSize: 11, letterSpacing: "0.18em",
          fontFamily: "'Share Tech Mono', monospace", color: "var(--text)",
        }}>LEADERBOARD</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {entries.map(entry => {
          const isMe = address?.toLowerCase() === entry.address.toLowerCase();
          const rankColor = entry.rank <= 3 ? RANK_COLOR[entry.rank - 1] : "var(--text-muted)";

          return (
            <div
              key={entry.rank}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.55rem 0.75rem",
                background: isMe ? "rgba(212,175,55,0.1)" : "var(--bg-input)",
                border: `1px solid ${isMe ? "var(--accent)" : "transparent"}`,
                borderLeft: `3px solid ${isMe ? "var(--accent)" : entry.rank <= 3 ? rankColor : "transparent"}`,
              }}
            >
              <div style={{
                width: 20, textAlign: "center", fontSize: 11,
                fontWeight: 800, color: rankColor, flexShrink: 0,
                fontFamily: "'Share Tech Mono', monospace",
              }}>
                {entry.rank}
              </div>
              <div style={{
                flex: 1, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: isMe ? "var(--text)" : "var(--text-muted)",
                fontFamily: "'Share Tech Mono', monospace",
              }}>
                {entry.address.slice(0, 6)}…{entry.address.slice(-4)}
                {isMe && <span style={{ marginLeft: "0.35rem", color: "var(--accent)" }}>(you)</span>}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>
                {entry.tasksCompleted}t
              </div>
              <div style={{
                fontWeight: 800, fontSize: 12, color: rankColor,
                fontFamily: "'Rajdhani', sans-serif",
              }}>
                {entry.points.toLocaleString()}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div style={{
            textAlign: "center", color: "var(--text-muted)",
            padding: "2rem", fontSize: 10,
            fontFamily: "'Share Tech Mono', monospace",
            letterSpacing: "0.1em",
          }}>
            NO ENTRIES YET
          </div>
        )}
      </div>
    </div>
  );
}
