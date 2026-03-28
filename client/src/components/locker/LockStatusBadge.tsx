interface Props {
  unlockDate: string;
  withdrawn: boolean;
}

export default function LockStatusBadge({ unlockDate, withdrawn }: Props) {
  if (withdrawn) {
    return <span style={{ background: "rgba(107,114,128,0.15)", color: "#9ca3af", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>Withdrawn</span>;
  }

  const unlocked = new Date(unlockDate) <= new Date();

  return unlocked ? (
    <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>Unlocked</span>
  ) : (
    <span style={{ background: "rgba(0,200,150,0.15)", color: "var(--accent)", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>Locked</span>
  );
}
