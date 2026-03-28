import { Link } from "react-router-dom";
import { Users, Clock } from "lucide-react";
import type { Quest } from "../../api/client";

interface Props {
  quest: Quest;
}

function timeLeft(end: string): string {
  const ms = new Date(end).getTime() - Date.now();
  if (ms <= 0) return "ENDED";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}D ${hours}H`;
  return `${hours}H LEFT`;
}

export default function QuestCard({ quest }: Props) {
  const isLive = new Date(quest.startDate) <= new Date() && new Date(quest.endDate) > new Date();
  const totalPts = quest.tasks.reduce((s, t) => s + t.points, 0);

  return (
    <Link to={`/quests/${quest.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          overflow: "hidden", transition: "all 0.15s",
          position: "relative",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 2, background: quest.featured ? "linear-gradient(90deg, #eab308, transparent)" : "linear-gradient(90deg, var(--accent), transparent)" }} />

        {/* Banner */}
        <div style={{
          height: 120, background: "linear-gradient(135deg, var(--bg-deep), var(--bg-card2))",
          overflow: "hidden", position: "relative",
        }}>
          {quest.bannerUrl && (
            <img src={quest.bannerUrl} alt={quest.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
          )}
          {/* Scanline overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(9,21,37,0.85))" }} />

          {/* Badges */}
          <div style={{ position: "absolute", top: "0.6rem", left: "0.6rem", display: "flex", gap: "0.35rem" }}>
            {quest.featured && (
              <span style={{
                background: "rgba(234,179,8,0.15)", color: "#eab308",
                border: "1px solid rgba(234,179,8,0.4)",
                padding: "1px 7px", fontSize: 9, fontWeight: 800,
                letterSpacing: "0.12em",
                fontFamily: "'Share Tech Mono', monospace",
              }}>FEATURED</span>
            )}
            {isLive && (
              <span style={{
                background: "rgba(212,175,55,0.15)", color: "var(--accent)",
                border: "1px solid var(--accent)",
                padding: "1px 7px", fontSize: 9, fontWeight: 800,
                letterSpacing: "0.12em",
                fontFamily: "'Share Tech Mono', monospace",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 5, height: 5, background: "var(--accent)", animation: "punkPulse 2s ease-in-out infinite" }} />
                LIVE
              </span>
            )}
          </div>

          {/* Points badge top-right */}
          <div style={{
            position: "absolute", top: "0.6rem", right: "0.6rem",
            background: "var(--bg-deep)", border: "1px solid var(--accent)",
            padding: "2px 8px",
            fontSize: 11, fontWeight: 800, color: "var(--accent)",
            fontFamily: "'Rajdhani', sans-serif",
            letterSpacing: "0.04em",
            boxShadow: "0 0 10px var(--accent-glow)",
          }}>
            +{totalPts}
          </div>
        </div>

        <div style={{ padding: "0.85rem 1rem" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: "0.3rem", fontFamily: "'Share Tech Mono', monospace" }}>
            {quest.projectName.toUpperCase()}
          </div>
          <div style={{
            fontWeight: 800, fontSize: 14, marginBottom: "0.6rem", color: "var(--text)",
            fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.02em",
            lineHeight: 1.2,
          }}>
            {quest.title}
          </div>

          {/* Tags */}
          {quest.tags.length > 0 && (
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {quest.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  background: "var(--bg-input)", color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  padding: "1px 6px", fontSize: 9,
                  letterSpacing: "0.1em",
                  fontFamily: "'Share Tech Mono', monospace",
                }}>{tag.toUpperCase()}</span>
              ))}
            </div>
          )}

          {/* Footer meta */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 10, color: "var(--text-muted)",
            fontFamily: "'Share Tech Mono', monospace",
            borderTop: "1px solid var(--border)", paddingTop: "0.6rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Users size={10} />
              <span>{quest.totalParticipants.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Clock size={10} />
              <span>{timeLeft(quest.endDate)}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
              {quest.tasks.length} TASKS
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
