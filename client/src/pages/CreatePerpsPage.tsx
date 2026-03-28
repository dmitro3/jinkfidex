import { useState } from "react";
import { useAccount, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { perpsApi, type PerpsSubmissionInput } from "../api/client";
import { CheckCircle, ChevronRight, AlertCircle, TrendingUp, Zap, Shield, DollarSign } from "lucide-react";

const FEE_RECIPIENT = import.meta.env.VITE_FEE_RECIPIENT_ADDRESS as `0x${string}` | undefined;
const FEE_ETH = "0.05";

const STEPS = ["TOKEN & PAIR", "MARKET PARAMS", "PAY & SUBMIT"] as const;

const LEVERAGE_OPTIONS = [5, 10, 25, 50, 100, 200, 500];
const CHAIN_OPTIONS = [
  { id: 1,    label: "Ethereum" },
  { id: 8453, label: "Base"     },
];

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  padding: "1.5rem",
};

const label: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.1em", color: "var(--text-muted)",
  marginBottom: "0.4rem",
  fontFamily: "'Share Tech Mono', monospace",
};

const input: React.CSSProperties = {
  width: "100%", padding: "0.6rem 0.75rem",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  color: "var(--text)", fontSize: 13,
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const select: React.CSSProperties = { ...input, cursor: "pointer" };

const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.75rem",
  background: "var(--accent)", border: "none",
  color: "#fff", fontWeight: 800, fontSize: 13,
  letterSpacing: "0.1em", cursor: "pointer",
  fontFamily: "'Share Tech Mono', monospace",
};

const btnOutline: React.CSSProperties = {
  padding: "0.7rem 1.5rem",
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-muted)", fontWeight: 700, fontSize: 13,
  letterSpacing: "0.08em", cursor: "pointer",
};

interface Form {
  // Step 1
  tokenAddress:        string;
  tokenSymbol:         string;
  tokenName:           string;
  quoteAsset:          "USDT" | "USDC";
  chainId:             number;
  oracleType:          "chainlink" | "pyth" | "custom";
  oracleAddress:       string;
  projectName:         string;
  projectUrl:          string;
  logoUrl:             string;
  // Step 2
  maxLeverage:         number;
  tradingFeeBps:       number;
  liquidationFeeBps:   number;
  initialMarginBps:    number;
  maintenanceMarginBps: number;
  maxOILong:           string;
  maxOIShort:          string;
  initialLiquidity:    string;
  description:         string;
  // Step 3
  paymentTxHash:       string;
}

const DEFAULT: Form = {
  tokenAddress: "", tokenSymbol: "", tokenName: "",
  quoteAsset: "USDT", chainId: 1,
  oracleType: "chainlink", oracleAddress: "",
  projectName: "", projectUrl: "", logoUrl: "",
  maxLeverage: 100,
  tradingFeeBps: 10,
  liquidationFeeBps: 100,
  initialMarginBps: 100,
  maintenanceMarginBps: 50,
  maxOILong: "1000000", maxOIShort: "1000000",
  initialLiquidity: "0",
  description: "",
  paymentTxHash: "",
};

export default function CreatePerpsPage() {
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState<Form>(DEFAULT);
  const [txSent, setTxSent] = useState(false);
  const [error, setError]   = useState("");
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  const set = (field: keyof Form, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  /* ── wagmi send tx ── */
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

  /* ── submit mutation ── */
  const submitMutation = useMutation({
    mutationFn: (body: PerpsSubmissionInput) => perpsApi.submit(body),
    onSuccess: () => navigate("/perps?submitted=1"),
    onError: (e: Error) => setError(e.message),
  });

  /* ── pay fee ── */
  async function handlePayFee() {
    setError("");
    if (!FEE_RECIPIENT) { setError("Fee recipient address not configured"); return; }
    try {
      const hash = await sendTransactionAsync({
        to: FEE_RECIPIENT,
        value: parseEther(FEE_ETH),
      });
      set("paymentTxHash", hash);
      setTxSent(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Transaction cancelled");
    }
  }

  /* ── final submit ── */
  async function handleSubmit() {
    if (!form.paymentTxHash) { setError("Please complete payment first"); return; }
    submitMutation.mutate({
      paymentTxHash:       form.paymentTxHash,
      paymentChainId:      form.chainId,
      tokenAddress:        form.tokenAddress,
      tokenSymbol:         form.tokenSymbol,
      tokenName:           form.tokenName,
      quoteAsset:          form.quoteAsset,
      chainId:             form.chainId,
      oracleType:          form.oracleType,
      oracleAddress:       form.oracleAddress || undefined,
      maxLeverage:         form.maxLeverage,
      tradingFeeBps:       form.tradingFeeBps,
      liquidationFeeBps:   form.liquidationFeeBps,
      initialMarginBps:    form.initialMarginBps,
      maintenanceMarginBps: form.maintenanceMarginBps,
      maxOILong:           form.maxOILong,
      maxOIShort:          form.maxOIShort,
      initialLiquidity:    form.initialLiquidity,
      description:         form.description,
      projectName:         form.projectName,
      projectUrl:          form.projectUrl || undefined,
      logoUrl:             form.logoUrl || undefined,
    });
  }

  /* ── step validation ── */
  function canAdvance() {
    if (step === 0)
      return /^0x[0-9a-fA-F]{40}$/.test(form.tokenAddress) &&
        form.tokenSymbol.length > 0 && form.tokenName.length > 0 &&
        form.projectName.length >= 2;
    if (step === 1)
      return form.description.length >= 10;
    return true;
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 3, height: 24, background: "var(--accent)" }} />
          <h1 style={{ fontWeight: 900, fontSize: 24, letterSpacing: "0.08em", fontFamily: "'Rajdhani', sans-serif" }}>
            CREATE PERPS MARKET
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, paddingLeft: "1rem" }}>
          List your token on JINKFI Perpetuals · Admin approval required · {FEE_ETH} ETH listing fee
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.75rem" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.45rem 0.9rem",
              background: i === step ? "var(--accent)" : i < step ? "rgba(212,175,55,0.15)" : "var(--bg-card)",
              border: `1px solid ${i <= step ? "var(--accent)" : "var(--border)"}`,
              color: i === step ? "#fff" : i < step ? "var(--accent)" : "var(--text-muted)",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
              fontFamily: "'Share Tech Mono', monospace",
              whiteSpace: "nowrap",
            }}>
              {i < step ? <CheckCircle size={11} /> : null}
              {i + 1}. {s}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? "var(--accent)" : "var(--border)", opacity: 0.5 }} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Token & Pair Info ── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <TrendingUp size={15} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>TOKEN INFORMATION</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>TOKEN CONTRACT ADDRESS *</label>
                <input style={input} placeholder="0x..." value={form.tokenAddress}
                  onChange={e => set("tokenAddress", e.target.value)} />
              </div>
              <div>
                <label style={label}>TOKEN SYMBOL *</label>
                <input style={input} placeholder="e.g. PEPE" value={form.tokenSymbol}
                  onChange={e => set("tokenSymbol", e.target.value.toUpperCase())} maxLength={20} />
              </div>
              <div>
                <label style={label}>TOKEN NAME *</label>
                <input style={input} placeholder="e.g. Pepe Coin" value={form.tokenName}
                  onChange={e => set("tokenName", e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={label}>QUOTE ASSET</label>
                <select style={select} value={form.quoteAsset}
                  onChange={e => set("quoteAsset", e.target.value as "USDT" | "USDC")}>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              <div>
                <label style={label}>CHAIN</label>
                <select style={select} value={form.chainId}
                  onChange={e => set("chainId", parseInt(e.target.value))}>
                  {CHAIN_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Zap size={15} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>PRICE ORACLE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={label}>ORACLE TYPE</label>
                <select style={select} value={form.oracleType}
                  onChange={e => set("oracleType", e.target.value as "chainlink" | "pyth" | "custom")}>
                  <option value="chainlink">Chainlink</option>
                  <option value="pyth">Pyth Network</option>
                  <option value="custom">Custom / TWAP</option>
                </select>
              </div>
              <div>
                <label style={label}>ORACLE ADDRESS {form.oracleType !== "custom" ? "(OPTIONAL)" : "*"}</label>
                <input style={input} placeholder="0x... feed address"
                  value={form.oracleAddress}
                  onChange={e => set("oracleAddress", e.target.value)} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <Shield size={15} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>PROJECT DETAILS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={label}>PROJECT NAME *</label>
                <input style={input} placeholder="e.g. Pepe Protocol" value={form.projectName}
                  onChange={e => set("projectName", e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={label}>PROJECT URL</label>
                <input style={input} placeholder="https://..." value={form.projectUrl}
                  onChange={e => set("projectUrl", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>LOGO URL</label>
                <input style={input} placeholder="https://... (png/svg recommended)" value={form.logoUrl}
                  onChange={e => set("logoUrl", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: Market Parameters ── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <TrendingUp size={15} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>LEVERAGE & MARGIN</span>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={label}>MAX LEVERAGE</label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {LEVERAGE_OPTIONS.map(lev => (
                  <button key={lev} onClick={() => set("maxLeverage", lev)} style={{
                    padding: "0.4rem 0.85rem",
                    background: form.maxLeverage === lev ? "var(--accent)" : "var(--bg-input)",
                    border: `1px solid ${form.maxLeverage === lev ? "var(--accent)" : "var(--border)"}`,
                    color: form.maxLeverage === lev ? "#fff" : "var(--text-muted)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    {lev}×
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={label}>INITIAL MARGIN (BPS)</label>
                <input style={input} type="number" min={10} max={10000}
                  value={form.initialMarginBps}
                  onChange={e => set("initialMarginBps", parseInt(e.target.value) || 100)} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {(form.initialMarginBps / 100).toFixed(2)}% — {Math.floor(10000 / form.initialMarginBps)}× effective max leverage
                </div>
              </div>
              <div>
                <label style={label}>MAINTENANCE MARGIN (BPS)</label>
                <input style={input} type="number" min={5} max={5000}
                  value={form.maintenanceMarginBps}
                  onChange={e => set("maintenanceMarginBps", parseInt(e.target.value) || 50)} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {(form.maintenanceMarginBps / 100).toFixed(2)}% — liquidation threshold
                </div>
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <DollarSign size={15} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em" }}>FEES & OPEN INTEREST</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={label}>TRADING FEE (BPS)</label>
                <input style={input} type="number" min={1} max={500}
                  value={form.tradingFeeBps}
                  onChange={e => set("tradingFeeBps", parseInt(e.target.value) || 10)} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {(form.tradingFeeBps / 100).toFixed(2)}% per trade
                </div>
              </div>
              <div>
                <label style={label}>LIQUIDATION FEE (BPS)</label>
                <input style={input} type="number" min={10} max={1000}
                  value={form.liquidationFeeBps}
                  onChange={e => set("liquidationFeeBps", parseInt(e.target.value) || 100)} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {(form.liquidationFeeBps / 100).toFixed(2)}% on liquidation
                </div>
              </div>
              <div>
                <label style={label}>MAX LONG OI (USD)</label>
                <input style={input} type="number" min={1000}
                  value={form.maxOILong}
                  onChange={e => set("maxOILong", e.target.value)} />
              </div>
              <div>
                <label style={label}>MAX SHORT OI (USD)</label>
                <input style={input} type="number" min={1000}
                  value={form.maxOIShort}
                  onChange={e => set("maxOIShort", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={label}>INITIAL LIQUIDITY (USD, OPTIONAL)</label>
                <input style={input} type="number" min={0} placeholder="0"
                  value={form.initialLiquidity}
                  onChange={e => set("initialLiquidity", e.target.value)} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Amount of initial liquidity you will seed into the market
                </div>
              </div>
            </div>
          </div>

          <div style={card}>
            <label style={label}>MARKET DESCRIPTION *</label>
            <textarea
              style={{ ...input, minHeight: 100, resize: "vertical" }}
              placeholder="Describe your token, project, and why traders should use this market..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              maxLength={2000}
            />
            <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", marginTop: "0.25rem" }}>
              {form.description.length}/2000
            </div>
          </div>

          {/* Preview card */}
          <div style={{ ...card, background: "var(--bg-card2)", borderColor: "var(--accent)", borderStyle: "dashed" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.85rem", fontFamily: "'Share Tech Mono', monospace" }}>
              MARKET PREVIEW
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { label: "PAIR",     value: `${form.tokenSymbol || "???"}/${form.quoteAsset}` },
                { label: "MAX LEV",  value: `${form.maxLeverage}×` },
                { label: "TRADE FEE", value: `${(form.tradingFeeBps / 100).toFixed(2)}%` },
                { label: "LIQ FEE",  value: `${(form.liquidationFeeBps / 100).toFixed(2)}%` },
                { label: "INIT MARGIN", value: `${(form.initialMarginBps / 100).toFixed(2)}%` },
                { label: "MAX OI",   value: `$${Number(form.maxOILong || 0).toLocaleString()}` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", fontFamily: "'Share Tech Mono', monospace" }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Pay & Submit ── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Summary */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem", fontFamily: "'Share Tech Mono', monospace" }}>
              SUBMISSION SUMMARY
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { k: "Market",       v: `${form.tokenSymbol}/${form.quoteAsset}` },
                { k: "Token",        v: form.tokenName },
                { k: "Chain",        v: CHAIN_OPTIONS.find(c => c.id === form.chainId)?.label ?? form.chainId },
                { k: "Oracle",       v: form.oracleType },
                { k: "Max Leverage", v: `${form.maxLeverage}×` },
                { k: "Trading Fee",  v: `${(form.tradingFeeBps / 100).toFixed(2)}%` },
                { k: "Max Long OI",  v: `$${Number(form.maxOILong).toLocaleString()}` },
                { k: "Max Short OI", v: `$${Number(form.maxOIShort).toLocaleString()}` },
                { k: "Project",      v: form.projectName },
              ].map(row => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>{row.k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div style={card}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1rem", fontFamily: "'Share Tech Mono', monospace" }}>
              LISTING FEE PAYMENT
            </div>

            <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Amount due</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: "var(--accent)", fontFamily: "'Rajdhani', sans-serif" }}>{FEE_ETH} ETH</span>
              </div>
              {FEE_RECIPIENT && (
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: "0.4rem", fontFamily: "'Share Tech Mono', monospace" }}>
                  TO: {FEE_RECIPIENT}
                </div>
              )}
            </div>

            {!txSent ? (
              <button
                onClick={handlePayFee}
                disabled={!isConnected || isSending}
                style={{ ...btnPrimary, width: "100%", opacity: (!isConnected || isSending) ? 0.5 : 1 }}
              >
                {isSending ? "SENDING..." : !isConnected ? "CONNECT WALLET FIRST" : `PAY ${FEE_ETH} ETH`}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#4ade80", padding: "0.6rem 0" }}>
                <CheckCircle size={16} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>Payment sent!</span>
              </div>
            )}

            {/* Manual tx hash fallback */}
            <div style={{ marginTop: "1rem" }}>
              <label style={{ ...label, marginBottom: "0.35rem" }}>
                OR PASTE TX HASH MANUALLY
              </label>
              <input
                style={input}
                placeholder="0x..."
                value={form.paymentTxHash}
                onChange={e => { set("paymentTxHash", e.target.value); if (e.target.value.length === 66) setTxSent(true); }}
              />
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "#f87171", fontSize: 12, padding: "0.75rem", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!form.paymentTxHash || submitMutation.isPending}
            style={{ ...btnPrimary, width: "100%", fontSize: 14, padding: "0.9rem", opacity: (!form.paymentTxHash || submitMutation.isPending) ? 0.5 : 1 }}
          >
            {submitMutation.isPending ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
          </button>

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
            Your market listing will be reviewed by the JINKFI team within 24–48 hours.
            You will be notified once approved or if additional info is required.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      {error && step < 2 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171", fontSize: 12, marginTop: "1rem", padding: "0.75rem", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.05)" }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => { setStep(s => Math.max(0, s - 1)); setError(""); }} disabled={step === 0} style={btnOutline}>
          ← BACK
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => { if (canAdvance()) { setStep(s => s + 1); setError(""); } else { setError("Please fill in all required fields"); } }}
            style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            NEXT <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
