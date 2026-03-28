export default function BackgroundRays() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>

      {/* Scanline overlay */}
      <div className="scanlines" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />

      {/* Grid pattern — honey gold tint */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(212,175,55,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212,175,55,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Top-left honey glow */}
      <div style={{
        position: "absolute", top: "-15%", left: "-10%",
        width: "55vw", height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 60%)",
        animation: "rayGlow 6s ease-in-out infinite",
      }} />

      {/* Bottom-right teal/mist glow */}
      <div style={{
        position: "absolute", bottom: "-15%", right: "-10%",
        width: "50vw", height: "50vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(122,157,158,0.08) 0%, transparent 60%)",
        animation: "rayGlow 8s ease-in-out 2s infinite",
      }} />

      {/* Top-right honey streak */}
      <div style={{
        position: "absolute", top: 0, right: "10%",
        width: 1, height: "40vh",
        background: "linear-gradient(180deg, rgba(212,175,55,0.5) 0%, transparent 100%)",
        opacity: 0.2,
      }} />

      {/* Bottom-left mist streak */}
      <div style={{
        position: "absolute", bottom: 0, left: "20%",
        width: 1, height: "30vh",
        background: "linear-gradient(0deg, rgba(122,157,158,0.6) 0%, transparent 100%)",
        opacity: 0.2,
      }} />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,21,32,0.55) 100%)",
      }} />
    </div>
  );
}
