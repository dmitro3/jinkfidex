import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useSendTransaction, useChainId } from "wagmi";
import { parseEther } from "viem";
import { ChevronRight, ChevronLeft, Zap, CheckCircle2, Loader, ExternalLink, Info } from "lucide-react";
import { stakingApi, type StakingSubmissionInput } from "../api/client";

const STAKING_FEE_ETH = "0.05";
const FEE_RECIPIENT = import.meta.env.VITE_FEE_RECIPIENT_ADDRESS ?? "0x0000000000000000000000000000000000000000";

const LOCK_OPTIONS = [
  { days: 0,   label: "Flexible (No Lock)" },
  { days: 7,   label: "7 Days"  },
  { days: 14,  label: "14 Days" },
  { days: 30,  label: "30 Days" },
  { days: 60,  label: "60 Days" },
  { days: 90,  label: "90 Days" },
  { days: 180, label: "180 Days" },
  { days: 365, label: "1 Year"  },
];

const CHAIN_OPTIONS = [
  { id: 1,     name: "Ethereum"      },
  { id: 8453,  name: "Base"          },
  { id: 42161, name: "Arbitrum"      },
  { id: 137,   name: "Polygon"       },
  { id: 10,    name: "Optimism"      },
  { id: 56,    name: "BNB Chain"     },
  { id: 10143, name: "Monad Testnet" },
  { id: 6342,  name: "MegaETH"       },
];

const STEPS = ["TOKEN INFO", "POOL CONFIG", "PAY & SUBMIT"];

function inputStyle(error?: boolean): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    background: "var(--bg-input)",
    border: `1px solid ${error ? "#f87171" : "var(--border)"}`,
    padding: "0.6rem 0.85rem",
    color: "var(--text)", fontSize: 13, outline: "none",
    fontFamily: "inherit", transition: "border-color 0.12s",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block", fontSize: 9, fontWeight: 800,
    letterSpacing: "0.18em", color: "var(--text-muted)",
    fontFamily: "'Share Tech Mono', monospace",
    marginBottom: "0.4rem",
  };
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle()}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 10, color: "#f87171", marginTop: "0.25rem" }}>{error}</div>}
    </div>
  );
}

export default function CreateStakingPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { sendTransactionAsync } = useSendTransaction();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 0 — Token Info
  const [tokenAddress,       setTokenAddress]       = useState("");
  const [tokenSymbol,        setTokenSymbol]        = useState("");
  const [tokenName,          setTokenName]          = useState("");
  const [tokenDecimals,      setTokenDecimals]      = useState("18");
  const [rewardTokenAddress, setRewardTokenAddress] = useState("");
  const [rewardTokenSymbol,  setRewardTokenSymbol]  = useState("");
  const [sameReward,         setSameReward]         = useState(true);
  const [projectName,        setProjectName]        = useState("");
  const [projectUrl,         setProjectUrl]         = useState("");
  const [logoUrl,            setLogoUrl]            = useState("");
  const [selectedChainId,    setSelectedChainId]    = useState(1);

  // Step 1 — Pool Config
  const [apy,               setApy]               = useState("");
  const [lockDays,          setLockDays]          = useState(0);
  const [minStake,          setMinStake]          = useState("0");
  const [maxStake,          setMaxStake]          = useState("");
  const [rewardBudget,      setRewardBudget]      = useState("");
  const [poolStartDate,     setPoolStartDate]     = useState("");
  const [poolEndDate,       setPoolEndDate]       = useState("");
  const [description,       setDescription]      = useState("");

  // Step 2 — Pay
  const [txHash,       setTxHash]       = useState("");
  const [sending,      setSending]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!tokenAddress.match(/^0x[0-9a-fA-F]{40}$/)) e.tokenAddress = "Invalid ERC-20 address";
    if (!tokenSymbol.trim())  e.tokenSymbol  = "Required";
    if (!tokenName.trim())    e.tokenName    = "Required";
    if (!projectName.trim())  e.projectName  = "Required";
    if (!sameReward && !rewardTokenAddress.match(/^0x[0-9a-fA-F]{40}$/))
      e.rewardTokenAddress = "Invalid reward token address";
    if (!sameReward && !rewardTokenSymbol.trim())
      e.rewardTokenSymbol = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!apy || isNaN(Number(apy)) || Number(apy) < 0) e.apy = "Enter a valid APY %";
    if (!poolStartDate) e.poolStartDate = "Required";
    if (!poolEndDate)   e.poolEndDate   = "Required";
    if (poolEndDate && poolStartDate && new Date(poolEndDate) <= new Date(poolStartDate))
      e.poolEndDate = "Must be after start date";
    if (!rewardBudget.trim()) e.rewardBudget = "Required";
    if (!description.trim())  e.description  = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function payFee() {
    setSending(true);
    setSubmitError("");
    try {
      const hash = await sendTransactionAsync({
        to: FEE_RECIPIENT as `0x${string}`,
        value: parseEther(STAKING_FEE_ETH),
      });
      setTxHash(hash);
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? "Transaction rejected");
    } finally {
      setSending(false);
    }
  }

  async function submitPool() {
    if (!txHash) { setSubmitError("Pay the listing fee first"); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: StakingSubmissionInput = {
        paymentTxHash:      txHash,
        paymentChainId:     chainId,
        tokenAddress,
        tokenSymbol,
        tokenName,
        tokenDecimals:      parseInt(tokenDecimals) || 18,
        rewardTokenAddress: sameReward ? tokenAddress       : rewardTokenAddress,
        rewardTokenSymbol:  sameReward ? tokenSymbol        : rewardTokenSymbol,
        chainId:            selectedChainId,
        apy:                parseFloat(apy),
        lockDays,
        minStake:           minStake || "0",
        maxStake:           maxStake || undefined,
        poolStartDate:      new Date(poolStartDate).toISOString(),
        poolEndDate:        new Date(poolEndDate).toISOString(),
        totalRewardBudget:  rewardBudget,
        description,
        projectName,
        projectUrl:         projectUrl  || undefined,
        logoUrl:            logoUrl     || undefined,
      };
      await stakingApi.submit(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError((err as Error).message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isConnected) {
    return (
      <div style={{ maxWidth: 560, margin: "6rem auto", textAlign: "center", padding: "0 1.5rem" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.14em" }}>
          CONNECT WALLET TO CREATE A STAKING POOL
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 560, margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
        <CheckCircle2 size={40} color="var(--accent)" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontWeight: 900, fontSize: 20, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
          POOL SUBMITTED
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Your staking pool is pending admin review. Once approved it will appear on the Staking page. Review typically takes 48 hours.
        </p>
        <button
          onClick={() => navigate("/staking")}
          style={{ padding: "0.5rem 1.5rem", background: "var(--accent)", border: "none", color: "var(--bg-deep)", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'Share Tech Mono', monospace" }}
        >
          BACK TO STAKING
        </button>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderTop: "2px solid var(--accent)", padding: "1.75rem",
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
          <div style={{ width: 2, height: 22, background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }} />
          <h1 style={{ fontWeight: 900, fontSize: 22, margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.08em" }}>
            CREATE STAKING POOL
          </h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>
          List your token's staking pool on JinkFI · {STAKING_FEE_ETH} ETH listing fee · Admin review required
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: "2rem" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", height: 3, background: i <= step ? "var(--accent)" : "var(--border)", transition: "background 0.2s", boxShadow: i <= step ? "0 0 8px var(--accent-glow)" : "none" }} />
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.14em", color: i === step ? "var(--accent)" : i < step ? "var(--text-muted)" : "var(--border)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.4rem" }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ── Step 0: Token Info ───────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

            <Field label="NETWORK" error={errors.chainId}>
              <select value={selectedChainId} onChange={e => setSelectedChainId(Number(e.target.value))} style={{ ...inputStyle(), appearance: "none" }}>
                {CHAIN_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>

            <Field label="PROJECT NAME *" error={errors.projectName}>
              <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Your Project" style={inputStyle(!!errors.projectName)} />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="STAKE TOKEN CONTRACT ADDRESS *" error={errors.tokenAddress}>
                <input value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} placeholder="0x..." style={inputStyle(!!errors.tokenAddress)} />
              </Field>
            </div>

            <Field label="TOKEN SYMBOL *" error={errors.tokenSymbol}>
              <input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} placeholder="MYTOKEN" style={inputStyle(!!errors.tokenSymbol)} />
            </Field>

            <Field label="TOKEN NAME *" error={errors.tokenName}>
              <input value={tokenName} onChange={e => setTokenName(e.target.value)} placeholder="My Token" style={inputStyle(!!errors.tokenName)} />
            </Field>

            <Field label="TOKEN DECIMALS">
              <input type="number" value={tokenDecimals} onChange={e => setTokenDecimals(e.target.value)} placeholder="18" style={inputStyle()} />
            </Field>

            <Field label="PROJECT URL">
              <input value={projectUrl} onChange={e => setProjectUrl(e.target.value)} placeholder="https://yourproject.xyz" style={inputStyle()} />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="LOGO URL (optional)">
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={inputStyle()} />
              </Field>
            </div>

            {/* Reward token toggle */}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input type="checkbox" id="sameReward" checked={sameReward} onChange={e => setSameReward(e.target.checked)}
                  style={{ accentColor: "var(--accent)", width: 14, height: 14 }} />
                <label htmlFor="sameReward" style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer", fontFamily: "'Share Tech Mono', monospace" }}>
                  REWARD TOKEN IS SAME AS STAKE TOKEN
                </label>
              </div>
            </div>

            {!sameReward && (
              <>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="REWARD TOKEN CONTRACT ADDRESS *" error={errors.rewardTokenAddress}>
                    <input value={rewardTokenAddress} onChange={e => setRewardTokenAddress(e.target.value)} placeholder="0x..." style={inputStyle(!!errors.rewardTokenAddress)} />
                  </Field>
                </div>
                <Field label="REWARD TOKEN SYMBOL *" error={errors.rewardTokenSymbol}>
                  <input value={rewardTokenSymbol} onChange={e => setRewardTokenSymbol(e.target.value)} placeholder="REWARD" style={inputStyle(!!errors.rewardTokenSymbol)} />
                </Field>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Pool Config ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

            <Field label="APY % *" error={errors.apy}>
              <input type="number" min={0} value={apy} onChange={e => setApy(e.target.value)} placeholder="e.g. 120" style={inputStyle(!!errors.apy)} />
            </Field>

            <Field label="LOCK PERIOD">
              <select value={lockDays} onChange={e => setLockDays(Number(e.target.value))} style={{ ...inputStyle(), appearance: "none" }}>
                {LOCK_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="MIN STAKE AMOUNT">
              <input value={minStake} onChange={e => setMinStake(e.target.value)} placeholder="0" style={inputStyle()} />
            </Field>

            <Field label="MAX STAKE AMOUNT (optional)">
              <input value={maxStake} onChange={e => setMaxStake(e.target.value)} placeholder="No limit" style={inputStyle()} />
            </Field>

            <Field label="POOL START DATE *" error={errors.poolStartDate}>
              <input type="datetime-local" value={poolStartDate} onChange={e => setPoolStartDate(e.target.value)} style={inputStyle(!!errors.poolStartDate)} />
            </Field>

            <Field label="POOL END DATE *" error={errors.poolEndDate}>
              <input type="datetime-local" value={poolEndDate} onChange={e => setPoolEndDate(e.target.value)} style={inputStyle(!!errors.poolEndDate)} />
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={`TOTAL REWARD BUDGET (in ${tokenSymbol || "tokens"}) *`} error={errors.rewardBudget}>
                <input value={rewardBudget} onChange={e => setRewardBudget(e.target.value)} placeholder="e.g. 1000000" style={inputStyle(!!errors.rewardBudget)} />
              </Field>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Info size={9} /> You must deposit this amount to the pool contract after approval
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="DESCRIPTION *" error={errors.description}>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your staking pool, tokenomics, and why users should stake..."
                  rows={4} style={{ ...inputStyle(!!errors.description), resize: "vertical" }} />
              </Field>
            </div>
          </div>

          {/* Preview card */}
          {tokenSymbol && apy && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>POOL PREVIEW</div>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>TOKEN</div>
                  <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Rajdhani', sans-serif" }}>{tokenSymbol}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>APY</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)", fontFamily: "'Rajdhani', sans-serif" }}>{apy}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>LOCK</div>
                  <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }}>
                    {lockDays === 0 ? "FLEXIBLE" : `${lockDays}D`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace" }}>REWARD</div>
                  <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }}>
                    {sameReward ? tokenSymbol : rewardTokenSymbol || "?"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Pay & Submit ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={cardStyle}>
          {/* Fee info */}
          <div style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderLeft: "3px solid var(--accent)", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.5rem" }}>LISTING FEE</div>
            <div style={{ fontWeight: 900, fontSize: 28, fontFamily: "'Rajdhani', sans-serif", color: "var(--accent)", lineHeight: 1 }}>{STAKING_FEE_ETH} ETH</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.35rem" }}>
              One-time fee per pool submission · Non-refundable if rejected
            </div>
          </div>

          {/* Summary */}
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-input)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.75rem" }}>SUBMISSION SUMMARY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: 11, fontFamily: "'Share Tech Mono', monospace" }}>
              {[
                ["PROJECT", projectName],
                ["TOKEN", `${tokenSymbol} (${tokenName})`],
                ["NETWORK", CHAIN_OPTIONS.find(c => c.id === selectedChainId)?.name ?? ""],
                ["APY", `${apy}%`],
                ["LOCK", lockDays === 0 ? "Flexible" : `${lockDays} days`],
                ["REWARD BUDGET", `${rewardBudget} ${sameReward ? tokenSymbol : rewardTokenSymbol}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.14em" }}>{k}</div>
                  <div style={{ color: "var(--text)", fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee recipient */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>FEE RECIPIENT</label>
            <div style={{ padding: "0.6rem 0.85rem", background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text)", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{FEE_RECIPIENT}</span>
              <a href={`https://etherscan.io/address/${FEE_RECIPIENT}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)" }}><ExternalLink size={12} /></a>
            </div>
          </div>

          {/* Pay button */}
          {!txHash ? (
            <button onClick={payFee} disabled={sending} style={{
              width: "100%", padding: "0.75rem",
              background: sending ? "transparent" : "var(--accent)",
              border: `1px solid var(--accent)`,
              color: sending ? "var(--accent)" : "var(--bg-deep)",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: 12, fontWeight: 900, letterSpacing: "0.12em",
              fontFamily: "'Share Tech Mono', monospace",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: sending ? "none" : "0 0 20px var(--accent-glow)",
              marginBottom: "1rem",
            }}>
              {sending ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> SENDING…</> : <><Zap size={13} /> PAY {STAKING_FEE_ETH} ETH</>}
            </button>
          ) : (
            <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", background: "rgba(212,175,55,0.1)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={14} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--accent)", fontFamily: "'Share Tech Mono', monospace" }}>PAYMENT CONFIRMED</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.15rem" }}>{txHash.slice(0, 20)}…{txHash.slice(-8)}</div>
              </div>
            </div>
          )}

          {!txHash && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.4rem" }}>
                OR PASTE TX HASH (manual payment)
              </label>
              <input value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." style={inputStyle()} />
            </div>
          )}

          {submitError && (
            <div style={{ fontSize: 11, color: "#f87171", fontFamily: "'Share Tech Mono', monospace", marginBottom: "0.75rem", letterSpacing: "0.06em" }}>✗ {submitError}</div>
          )}

          <button onClick={submitPool} disabled={!txHash || submitting} style={{
            width: "100%", padding: "0.75rem",
            background: txHash && !submitting ? "var(--punk)" : "transparent",
            border: `1px solid ${txHash ? "var(--punk)" : "var(--border)"}`,
            color: txHash && !submitting ? "#fff" : "var(--text-muted)",
            cursor: txHash && !submitting ? "pointer" : "not-allowed",
            fontSize: 12, fontWeight: 900, letterSpacing: "0.12em",
            fontFamily: "'Share Tech Mono', monospace",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}>
            {submitting ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> SUBMITTING…</> : "SUBMIT FOR REVIEW"}
          </button>

          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Share Tech Mono', monospace", marginTop: "0.75rem", lineHeight: 1.6 }}>
            Submitted by {address?.slice(0, 6)}…{address?.slice(-4)} · Reviewed within 48 hours
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.25rem" }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.5rem 1.25rem",
          background: "transparent", border: "1px solid var(--border)",
          color: step === 0 ? "var(--border)" : "var(--text-muted)",
          cursor: step === 0 ? "not-allowed" : "pointer",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <ChevronLeft size={13} /> BACK
        </button>

        {step < 2 && (
          <button onClick={() => {
            const valid = step === 0 ? validateStep0() : validateStep1();
            if (valid) setStep(s => s + 1);
          }} style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.25rem",
            background: "var(--accent)", border: "none",
            color: "var(--bg-deep)", cursor: "pointer",
            fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
            fontFamily: "'Share Tech Mono', monospace",
            boxShadow: "0 0 14px var(--accent-glow)",
          }}>
            NEXT <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
