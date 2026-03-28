import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Loader, Lock } from "lucide-react";
import { useAccount } from "wagmi";
import type { QuestTask } from "../../api/client";

interface Props {
  task: QuestTask;
  completed: boolean;
  onVerify: (taskId: string, answer?: string, txHash?: string, twitterUserId?: string, discordUserId?: string) => Promise<{ success: boolean; pointsEarned: number }>;
  isVerifying: boolean;
  result?: boolean;
}

const TASK_TYPE_LABEL: Record<string, string> = {
  twitter_follow:  "SOCIAL",
  twitter_retweet: "SOCIAL",
  discord_join:    "SOCIAL",
  quiz:            "QUIZ",
  onchain:         "ON-CHAIN",
};

const TASK_TYPE_COLOR: Record<string, string> = {
  twitter_follow:  "#1d9bf0",
  twitter_retweet: "#1d9bf0",
  discord_join:    "#5865f2",
  quiz:            "#eab308",
  onchain:         "var(--accent)",
};

export default function TaskItem({ task, completed, onVerify, isVerifying, result }: Props) {
  const { isConnected } = useAccount();
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [txHash, setTxHash] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [socialDone, setSocialDone] = useState(false);
  const [twitterUserId, setTwitterUserId] = useState("");
  const [discordUserId, setDiscordUserId] = useState("");

  const options: string[] = (task.metadata?.options as string[]) ?? [];
  const isQuiz     = task.type === "quiz";
  const isSocial   = ["twitter_follow", "twitter_retweet", "discord_join"].includes(task.type);
  const isTwitter  = task.type === "twitter_follow" || task.type === "twitter_retweet";
  const isDiscord  = task.type === "discord_join";
  const isOnchain  = task.type === "onchain";

  const typeLabel = TASK_TYPE_LABEL[task.type] ?? task.type.toUpperCase();
  const typeColor = TASK_TYPE_COLOR[task.type] ?? "var(--text-muted)";

  const canVerify = isConnected && !isVerifying && (
    (isQuiz && (!!selectedOption || !!answer)) ||
    (isOnchain && !!txHash) ||
    (isSocial && socialDone) ||
    (!isQuiz && !isOnchain && !isSocial)
  );

  const handleVerify = () => {
    if (isQuiz) onVerify(task.id, selectedOption ?? answer);
    else if (isOnchain) onVerify(task.id, undefined, txHash);
    else if (isTwitter) onVerify(task.id, undefined, undefined, twitterUserId || undefined);
    else if (isDiscord) onVerify(task.id, undefined, undefined, undefined, discordUserId || undefined);
    else onVerify(task.id);
  };

  return (
    <div style={{
      background: "var(--bg-card)", overflow: "hidden",
      border: `1px solid ${completed ? "rgba(212,175,55,0.4)" : result === false ? "rgba(248,113,113,0.3)" : "var(--border)"}`,
      borderLeft: `3px solid ${completed ? "var(--accent)" : result === false ? "#f87171" : "transparent"}`,
      transition: "border-color 0.2s",
    }}>
      {/* Header row */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", cursor: "pointer" }}
        onClick={() => !completed && setExpanded(o => !o)}
      >
        {/* Status indicator */}
        <div style={{
          width: 20, height: 20,
          border: `2px solid ${completed ? "var(--accent)" : result === false ? "#f87171" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          background: completed ? "rgba(212,175,55,0.15)" : "transparent",
          boxShadow: completed ? "0 0 8px var(--accent-glow)" : "none",
        }}>
          {completed && <CheckCircle2 size={11} color="var(--accent)" />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: completed ? "var(--text-muted)" : "var(--text)", textDecoration: completed ? "line-through" : "none" }}>
              {task.title}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.15em",
              color: typeColor, border: `1px solid ${typeColor}`,
              padding: "0px 5px",
              fontFamily: "'Share Tech Mono', monospace",
              opacity: 0.8,
            }}>{typeLabel}</span>
            {task.required && (
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: "0.1em",
                color: "var(--text-muted)", border: "1px solid var(--border)",
                padding: "0px 5px",
                fontFamily: "'Share Tech Mono', monospace",
              }}>REQ</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{task.description}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
          <span style={{
            fontWeight: 900, color: completed ? "var(--text-muted)" : "var(--accent)",
            fontSize: 13, fontFamily: "'Rajdhani', sans-serif",
          }}>+{task.points}</span>
          {!completed && (
            expanded
              ? <ChevronUp size={13} color="var(--text-muted)" />
              : <ChevronDown size={13} color="var(--text-muted)" />
          )}
          {completed && <CheckCircle2 size={13} color="var(--accent)" />}
        </div>
      </div>

      {/* Expanded body */}
      {expanded && !completed && (
        <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: "0.85rem" }}>

            {/* Social task */}
            {isSocial && task.link && (
              <div style={{ marginBottom: "0.75rem" }}>
                <a
                  href={task.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setTimeout(() => setSocialDone(true), 2000)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.45rem 1rem",
                    background: "transparent", border: `1px solid ${typeColor}`,
                    color: typeColor, fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em", textDecoration: "none",
                    fontFamily: "'Share Tech Mono', monospace",
                    transition: "all 0.12s",
                  }}
                >
                  <ExternalLink size={11} /> OPEN EXTERNAL SITE
                </a>
                {socialDone && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.5rem", fontFamily: "'Share Tech Mono', monospace" }}>
                    Done? Enter your ID below and click Verify ↓
                  </div>
                )}
              </div>
            )}

            {/* Twitter ID input */}
            {isTwitter && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "0.3rem", fontFamily: "'Share Tech Mono', monospace" }}>
                  YOUR TWITTER USER ID <span style={{ opacity: 0.6 }}>(numeric — find at tweeterid.com)</span>
                </div>
                <input
                  placeholder="e.g. 1234567890"
                  value={twitterUserId}
                  onChange={e => setTwitterUserId(e.target.value)}
                  style={{
                    width: "100%", background: "var(--bg-input)",
                    border: "1px solid var(--border)", padding: "0.55rem 0.85rem",
                    color: "var(--text)", fontSize: 12, outline: "none",
                    boxSizing: "border-box", fontFamily: "'Share Tech Mono', monospace",
                  }}
                />
              </div>
            )}

            {/* Discord ID input */}
            {isDiscord && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "0.3rem", fontFamily: "'Share Tech Mono', monospace" }}>
                  YOUR DISCORD USER ID <span style={{ opacity: 0.6 }}>(enable Dev Mode → right-click profile → Copy ID)</span>
                </div>
                <input
                  placeholder="e.g. 123456789012345678"
                  value={discordUserId}
                  onChange={e => setDiscordUserId(e.target.value)}
                  style={{
                    width: "100%", background: "var(--bg-input)",
                    border: "1px solid var(--border)", padding: "0.55rem 0.85rem",
                    color: "var(--text)", fontSize: 12, outline: "none",
                    boxSizing: "border-box", fontFamily: "'Share Tech Mono', monospace",
                  }}
                />
              </div>
            )}

            {/* Quiz options */}
            {isQuiz && options.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(opt)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      padding: "0.5rem 0.85rem",
                      border: `1px solid ${selectedOption === opt ? "var(--accent)" : "var(--border)"}`,
                      background: selectedOption === opt ? "rgba(212,175,55,0.1)" : "transparent",
                      color: selectedOption === opt ? "var(--text)" : "var(--text-muted)",
                      cursor: "pointer", fontSize: 12, textAlign: "left",
                      transition: "all 0.12s",
                      boxShadow: selectedOption === opt ? "0 0 8px var(--accent-glow)" : "none",
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, flexShrink: 0,
                      border: `1px solid ${selectedOption === opt ? "var(--accent)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800,
                      background: selectedOption === opt ? "var(--accent)" : "transparent",
                      color: selectedOption === opt ? "var(--bg-deep)" : "var(--text-muted)",
                      fontFamily: "'Share Tech Mono', monospace",
                    }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Manual text answer */}
            {!isQuiz && !isSocial && !isOnchain && (
              <input
                placeholder="Your answer..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                style={{
                  width: "100%", background: "var(--bg-input)",
                  border: "1px solid var(--border)", padding: "0.55rem 0.85rem",
                  color: "var(--text)", fontSize: 12, outline: "none",
                  marginBottom: "0.75rem", boxSizing: "border-box",
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              />
            )}

            {/* Onchain tx hash */}
            {isOnchain && (
              <input
                placeholder="Transaction hash (0x...)"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                style={{
                  width: "100%", background: "var(--bg-input)",
                  border: "1px solid var(--border)", padding: "0.55rem 0.85rem",
                  color: "var(--text)", fontSize: 11, outline: "none",
                  marginBottom: "0.75rem", boxSizing: "border-box",
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              />
            )}

            {result === false && (
              <div style={{ fontSize: 11, color: "#f87171", marginBottom: "0.5rem", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.08em" }}>
                ✗ INCORRECT — TRY AGAIN
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={handleVerify}
                disabled={!canVerify}
                style={{
                  padding: "0.5rem 1.25rem",
                  background: canVerify ? "var(--accent)" : "transparent",
                  border: `1px solid ${canVerify ? "var(--accent)" : "var(--border)"}`,
                  color: canVerify ? "var(--bg-deep)" : "var(--text-muted)",
                  cursor: canVerify ? "pointer" : "not-allowed",
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
                  fontFamily: "'Share Tech Mono', monospace",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  transition: "all 0.12s",
                  boxShadow: canVerify ? "0 0 14px var(--accent-glow)" : "none",
                }}
              >
                {isVerifying
                  ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> VERIFYING…</>
                  : "VERIFY"}
              </button>
              {!isConnected && (
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Lock size={10} /> CONNECT WALLET TO VERIFY
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
