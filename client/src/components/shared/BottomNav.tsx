import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight, Droplets, TrendingUp, Trophy, BarChart2, User,
} from "lucide-react";

const NAV = [
  { to: "/swap",        icon: ArrowLeftRight, label: "SWAP"   },
  { to: "/pool",        icon: Droplets,       label: "POOL"   },
  { to: "/perps",       icon: TrendingUp,     label: "PERPS"  },
  { to: "/quests",      icon: Trophy,         label: "QUESTS" },
  { to: "/leaderboard", icon: BarChart2,      label: "RANKS"  },
  { to: "/profile",     icon: User,           label: "PROFILE"},
];

export default function BottomNav() {
  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: 60,
      background: "rgba(0,21,32,0.98)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      alignItems: "stretch",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Top gradient line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, var(--accent), var(--punk), transparent)",
        opacity: 0.5,
      }} />

      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.15rem",
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text-muted)",
            fontSize: 8,
            fontWeight: isActive ? 700 : 500,
            letterSpacing: "0.1em",
            fontFamily: "'Share Tech Mono', monospace",
            background: isActive ? "rgba(212,175,55,0.07)" : "transparent",
            borderTop: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
            boxShadow: isActive ? "inset 0 -1px 0 var(--accent-glow)" : "none",
            transition: "all 0.12s",
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={16} style={{ opacity: isActive ? 1 : 0.45 }} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
