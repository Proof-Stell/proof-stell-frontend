"use client";
import React, { useEffect, useState } from "react";
import { useWallet } from "@/components/providers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCredentialsByWallet,
  issueCredential,
  revokeCredential,
  type CredentialSummary,
  type IssueCredentialInput,
} from "@/lib/api/proofstell";
import { shortHash } from "@/utils/hash";

// Demo issuer wallet
const ISSUER_WALLET = "GBZX4364PEPQTDICMIQDZ56K4T75QZCR4NBEYKO6PDRFERNTR5LR2HL";

type Tab = "issued" | "issue_new";
type IssueStatus = "idle" | "submitting" | "success" | "error";

const CREDENTIAL_TYPES = [
  "Academic Degree",
  "Professional Certificate",
  "Identity Document",
  "Employment Letter",
  "Compliance Certificate",
  "License",
  "Other",
];

const STATUS_COLOR: Record<string, string> = {
  valid: "#00dc96",
  revoked: "#ef4444",
  expired: "#f59e0b",
  not_found: "#5a8070",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Issued credential row ──────────────────────────────────────────────────

function IssuerCredRow({
  cred,
  onRevoke,
}: {
  cred: CredentialSummary;
  onRevoke: (id: string) => void;
}) {
  const [revoking, setRevoking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleRevoke = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setRevoking(true);
    await onRevoke(cred.id);
    setRevoking(false);
    setConfirmed(false);
  };

  return (
    <div style={rs.row}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={rs.credTitle}>{cred.title}</div>
        <div style={rs.credType}>{cred.type}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rs.metaLabel}>RECIPIENT</div>
        <div style={rs.metaVal}>{shortHash(cred.hash, 5)}</div>
      </div>
      <div style={{ width: 100, flexShrink: 0 }}>
        <div style={rs.metaLabel}>ISSUED</div>
        <div style={rs.metaVal}>{fmt(cred.issuedAt)}</div>
      </div>
      <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[cred.status] ?? "#5a8070" }} />
        <span style={{ fontSize: "0.6rem", color: STATUS_COLOR[cred.status] ?? "#5a8070", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em" }}>
          {cred.status.toUpperCase()}
        </span>
      </div>
      <div style={{ width: 110, flexShrink: 0 }}>
        {cred.status === "valid" && (
          <button
            onClick={handleRevoke}
            disabled={revoking}
            style={{
              background: confirmed ? "rgba(239,68,68,0.15)" : "transparent",
              border: `1px solid ${confirmed ? "rgba(239,68,68,0.5)" : "rgba(0,220,150,0.15)"}`,
              color: confirmed ? "#ef4444" : "#3a6050",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.55rem", letterSpacing: "0.1em",
              padding: "5px 10px", cursor: revoking ? "not-allowed" : "pointer",
              borderRadius: 2, transition: "all 0.2s",
            }}
          >
            {revoking ? "…" : confirmed ? "CONFIRM" : "REVOKE"}
          </button>
        )}
      </div>
    </div>
  );
}

const rs: Record<string, React.CSSProperties> = {
  row: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "14px 20px",
    borderBottom: "1px solid rgba(0,220,150,0.06)",
    transition: "background 0.15s",
  },
  credTitle: {
    fontSize: "0.78rem", color: "#b0d8c8",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700, whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  credType: { fontSize: "0.6rem", color: "#3a6050", marginTop: 2 },
  metaLabel: { fontSize: "0.5rem", letterSpacing: "0.15em", color: "#2a4a3a" },
  metaVal: { fontSize: "0.65rem", color: "#5a8070", fontFamily: "'DM Mono', monospace", marginTop: 2 },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function IssuerPage() {
  const { status, walletAddress, logout } = useWallet();
  const [tab, setTab] = useState<Tab>("issued");
  const [issued, setIssued] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueStatus, setIssueStatus] = useState<IssueStatus>("idle");
  const [issueError, setIssueError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<IssueCredentialInput>({
    recipientWallet: "",
    title: "",
    type: CREDENTIAL_TYPES[0],
    description: "",
    documentHash: "",
    expiresAt: "",
  });

  const activeWallet = walletAddress || ISSUER_WALLET;

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status !== "connected" || !walletAddress) return;

    setLoading(true);
    getCredentialsByWallet(activeWallet)
      .then((data) => {
        setIssued(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [status, walletAddress, activeWallet]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeCredential(id, activeWallet);
      setIssued((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "revoked" } : c)),
      );
    } catch (e: unknown) {
      console.error("Revoke failed:", (e as Error).message);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientWallet || !form.title || !form.documentHash) {
      setIssueError("Recipient wallet, title, and document hash are required.");
      return;
    }
    setIssueStatus("submitting");
    setIssueError(null);
    try {
      const newCred = await issueCredential(form, activeWallet);
      setIssued((prev) => [newCred, ...prev]);
      setIssueStatus("success");
      setForm({ recipientWallet: "", title: "", type: CREDENTIAL_TYPES[0], description: "", documentHash: "", expiresAt: "" });
      setTimeout(() => { setIssueStatus("idle"); setTab("issued"); }, 2000);
    } catch (err: unknown) {
      setIssueError((err as Error)?.message ?? "Failed to issue credential.");
      setIssueStatus("error");
    }
  };

  const setField = (k: keyof IssueCredentialInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const router = useRouter();

  if (status === "loading" || status === "idle") {
    return (
      <>
        <title>Loading Issuer Portal — ProofStell</title>
        <div style={p.page}>
          <div style={p.grid} />
          <div style={p.glow} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#3a6050", fontFamily: "'Space Mono', monospace" }}>
            INITIALIZING SECURE SESSION…
          </div>
        </div>
      </>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <title>Access Issuer Portal — ProofStell</title>
        <div style={p.page}>
          <div style={p.grid} />
          <div style={p.glow} />
          
          <header style={p.header}>
            <Link href="/" style={p.navLogo}>
              <div style={p.logoMark}><div style={p.logoInner} /></div>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e8f5f0", fontFamily: "'Space Mono', monospace" }}>
                Proof<span style={{ color: "#00dc96" }}>Stell</span>
              </span>
            </Link>
          </header>

          <div style={{ ...p.body, alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 120px)" }}>
            <div style={{
              background: "rgba(0,18,12,0.8)",
              border: "1px solid rgba(0,220,150,0.15)",
              borderRadius: 4,
              padding: "40px 32px",
              maxWidth: 450,
              width: "100%",
              textAlign: "center",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#00dc96" }} />
              <div style={{ fontSize: "2.5rem", marginBottom: 20 }}>🔒</div>
              <h2 style={{ fontFamily: "'Space Mono', monospace", color: "#e8f5f0", fontSize: "1.2rem", fontWeight: 700, marginBottom: 12 }}>
                Authentication Required
              </h2>
              <p style={{ color: "#5a8070", fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 28 }}>
                Please connect your Stellar wallet to access the verified credentials issuer portal.
              </p>
              <button onClick={() => router.push("/signup")} style={{ ...p.primaryBtn, width: "100%" }}>
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Issuer Portal — ProofStell</title>

      <div style={p.page}>
        <div style={p.grid} />
        <div style={p.glow} />

        {/* Nav */}
        <header style={p.header}>
          <Link href="/" style={p.navLogo}>
            <div style={p.logoMark}><div style={p.logoInner} /></div>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e8f5f0", fontFamily: "'Space Mono', monospace" }}>
              Proof<span style={{ color: "#00dc96" }}>Stell</span>
            </span>
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/verify" style={p.navLink}>VERIFY</Link>
            <Link href="/dashboard" style={p.navLink}>DASHBOARD</Link>
            <span style={{ ...p.navLink, color: "#00dc96", borderBottom: "1px solid #00dc96", paddingBottom: 2 }}>ISSUER PORTAL</span>
            {status === "connected" && (
              <button 
                id="issuer-logout-btn"
                onClick={async () => { await logout(); router.push("/"); }} 
                style={{
                  background: "transparent",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                  borderRadius: 2,
                  cursor: "pointer",
                  fontFamily: "'Space Mono', monospace",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                LOGOUT
              </button>
            )}
          </nav>
        </header>

        <div style={p.body}>
          {/* Title */}
          <div style={p.titleRow}>
            <div>
              <div style={p.sysLabel}>ISSUER_PORTAL.SYS</div>
              <h1 style={p.pageTitle}>Issuer Portal</h1>
              <p style={p.walletAddr}>
                <span style={{ color: "#3a6050" }}>ISSUER ·</span>{" "}
                {ISSUER_WALLET.slice(0, 8)}…{ISSUER_WALLET.slice(-6)}
                <span style={{ marginLeft: 8, color: "#00dc96", fontSize: "0.55rem", background: "rgba(0,220,150,0.08)", border: "1px solid rgba(0,220,150,0.2)", padding: "1px 7px", borderRadius: 1 }}>
                  ✓ VERIFIED ISSUER
                </span>
              </p>
            </div>
            <button
              onClick={() => setTab("issue_new")}
              style={p.primaryBtn}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00c488")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00dc96")}
            >
              + ISSUE CREDENTIAL
            </button>
          </div>

          {/* Stats */}
          <div style={p.statsRow}>
            {[
              { label: "ISSUED",  value: issued.length, color: "#e8f5f0" },
              { label: "ACTIVE",  value: issued.filter((c) => c.status === "valid").length, color: "#00dc96" },
              { label: "REVOKED", value: issued.filter((c) => c.status === "revoked").length, color: "#ef4444" },
            ].map((st, i) => (
              <div key={st.label} style={{ ...p.statItem, borderLeft: i > 0 ? "1px solid rgba(0,220,150,0.08)" : "none", paddingLeft: i > 0 ? 24 : 0 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: st.color, lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3a6050", marginTop: 4 }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={p.tabs}>
            <button onClick={() => setTab("issued")} style={{ ...p.tab, ...(tab === "issued" ? p.tabActive : {}) }}>ISSUED CREDENTIALS</button>
            <button onClick={() => setTab("issue_new")} style={{ ...p.tab, ...(tab === "issue_new" ? p.tabActive : {}) }}>ISSUE NEW</button>
          </div>

          {/* Issued list */}
          {tab === "issued" && (
            <div style={p.panel}>
              {/* Table header */}
              <div style={{ ...rs.row, borderBottom: "1px solid rgba(0,220,150,0.1)", paddingBottom: 10 }}>
                {["CREDENTIAL", "HASH", "ISSUED", "STATUS", ""].map((h) => (
                  <div key={h} style={{ flex: h === "CREDENTIAL" ? 2 : 1, minWidth: 0, fontSize: "0.5rem", letterSpacing: "0.15em", color: "#2a4a3a" }}>{h}</div>
                ))}
              </div>
              {loading && <div style={p.empty}>LOADING…</div>}
              {!loading && issued.length === 0 && <div style={p.empty}>No credentials issued yet.</div>}
              {issued.map((c) => (
                <IssuerCredRow key={c.id} cred={c} onRevoke={handleRevoke} />
              ))}
            </div>
          )}

          {/* Issue new form */}
          {tab === "issue_new" && (
            <div style={p.panel}>
              {issueStatus === "success" ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: "2.5rem", color: "#00dc96", marginBottom: 12 }}>✓</div>
                  <p style={{ fontFamily: "'Space Mono', monospace", color: "#00dc96", fontSize: "0.85rem", margin: 0 }}>Credential issued on-chain.</p>
                  <p style={{ color: "#3a6050", fontSize: "0.7rem", marginTop: 8 }}>Redirecting to issued list…</p>
                </div>
              ) : (
                <form onSubmit={handleIssue} style={p.form}>
                  <div style={p.formGrid}>
                    {/* Recipient */}
                    <div style={p.field}>
                      <label style={p.label}>RECIPIENT WALLET ADDRESS *</label>
                      <input value={form.recipientWallet} onChange={setField("recipientWallet")} placeholder="G…" style={p.input} required />
                    </div>

                    {/* Title */}
                    <div style={p.field}>
                      <label style={p.label}>CREDENTIAL TITLE *</label>
                      <input value={form.title} onChange={setField("title")} placeholder="Bachelor of Science — Computer Science" style={p.input} required />
                    </div>

                    {/* Type */}
                    <div style={p.field}>
                      <label style={p.label}>CREDENTIAL TYPE *</label>
                      <select value={form.type} onChange={setField("type")} style={p.input}>
                        {CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Expiry */}
                    <div style={p.field}>
                      <label style={p.label}>EXPIRY DATE (OPTIONAL)</label>
                      <input type="date" value={form.expiresAt} onChange={setField("expiresAt")} style={p.input} />
                    </div>

                    {/* Document hash */}
                    <div style={{ ...p.field, gridColumn: "1 / -1" }}>
                      <label style={p.label}>DOCUMENT SHA-256 HASH *</label>
                      <input
                        value={form.documentHash}
                        onChange={setField("documentHash")}
                        placeholder="64-character hex hash of the document"
                        style={p.input}
                        required
                      />
                      <p style={{ fontSize: "0.6rem", color: "#3a6050", margin: "6px 0 0 0" }}>
                        Use the <Link href="/verify" style={{ color: "#00dc96" }}>Verify page</Link> to compute a file&apos;s SHA-256 hash.
                      </p>
                    </div>

                    {/* Description */}
                    <div style={{ ...p.field, gridColumn: "1 / -1" }}>
                      <label style={p.label}>DESCRIPTION (OPTIONAL)</label>
                      <textarea value={form.description} onChange={setField("description")} rows={3} style={{ ...p.input, resize: "none" }} placeholder="Certifies successful completion of…" />
                    </div>
                  </div>

                  {issueError && (
                    <div style={{ ...p.errorBox, marginTop: 0 }}>⚠ {issueError}</div>
                  )}

                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={issueStatus === "submitting"}
                      style={{ ...p.primaryBtn, opacity: issueStatus === "submitting" ? 0.7 : 1 }}
                    >
                      {issueStatus === "submitting" ? "ISSUING ON-CHAIN…" : "ISSUE CREDENTIAL →"}
                    </button>
                    <button type="button" onClick={() => setTab("issued")} style={p.secondaryBtn}>
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const p: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#060d0a", fontFamily: "'DM Mono', 'Space Mono', monospace", position: "relative" },
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(0,220,150,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.025) 1px, transparent 1px)",
    backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0,
  },
  glow: {
    position: "fixed", top: "-10%", left: "60%",
    width: "50vw", height: "50vh",
    background: "radial-gradient(ellipse, rgba(0,220,150,0.04) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    position: "sticky", top: 0, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 40px", height: 60,
    background: "rgba(6,13,10,0.9)", borderBottom: "1px solid rgba(0,220,150,0.08)",
    backdropFilter: "blur(8px)",
  },
  navLogo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none" },
  logoMark: { width: 22, height: 22, border: "2px solid #00dc96", display: "flex", alignItems: "center", justifyContent: "center" },
  logoInner: { width: 8, height: 8, background: "#00dc96", transform: "rotate(45deg)" },
  navLink: { fontSize: "0.6rem", letterSpacing: "0.12em", color: "#3a6050", textDecoration: "none" },
  body: { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: 32 },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 },
  sysLabel: { fontSize: "0.58rem", letterSpacing: "0.18em", color: "#00dc96", marginBottom: 8 },
  pageTitle: { fontFamily: "'Space Mono', monospace", fontSize: "1.8rem", fontWeight: 700, color: "#e8f5f0", margin: "0 0 6px 0" },
  walletAddr: { fontSize: "0.65rem", color: "#5a8070", margin: 0, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 },
  statsRow: {
    display: "flex", gap: 0,
    background: "rgba(0,18,12,0.8)", border: "1px solid rgba(0,220,150,0.1)",
    borderRadius: 3, padding: "20px 28px",
  },
  statItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" },
  tabs: { display: "flex", borderBottom: "1px solid rgba(0,220,150,0.08)" },
  tab: {
    background: "transparent", border: "none", borderBottom: "2px solid transparent",
    color: "#3a6050", fontFamily: "'Space Mono', monospace",
    fontSize: "0.6rem", letterSpacing: "0.12em",
    padding: "10px 20px", cursor: "pointer", marginBottom: -1, transition: "all 0.2s",
  },
  tabActive: { color: "#00dc96", borderBottomColor: "#00dc96" },
  panel: {
    background: "rgba(0,18,12,0.8)", border: "1px solid rgba(0,220,150,0.1)",
    borderRadius: 3, overflow: "hidden",
  },
  empty: { textAlign: "center", padding: "48px 0", color: "#3a6050", fontSize: "0.72rem" },
  form: { padding: "28px", display: "flex", flexDirection: "column", gap: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3a6050" },
  input: {
    background: "rgba(0,30,20,0.8)", border: "1px solid rgba(0,220,150,0.12)",
    color: "#b0d8c8", fontFamily: "'DM Mono', monospace",
    fontSize: "0.75rem", padding: "10px 12px", borderRadius: 2,
    outline: "none", width: "100%", boxSizing: "border-box",
    appearance: "none",
  },
  errorBox: {
    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 2, padding: "12px 16px",
    fontSize: "0.72rem", color: "#ef4444",
  },
  primaryBtn: {
    background: "#00dc96", border: "none", color: "#000",
    fontFamily: "'Space Mono', monospace", fontWeight: 700,
    fontSize: "0.65rem", letterSpacing: "0.1em",
    padding: "11px 20px", cursor: "pointer", borderRadius: 2, transition: "background 0.2s",
  },
  secondaryBtn: {
    background: "transparent", border: "1px solid rgba(0,220,150,0.2)",
    color: "#3a6050", fontFamily: "'Space Mono', monospace",
    fontSize: "0.65rem", letterSpacing: "0.1em",
    padding: "11px 20px", cursor: "pointer", borderRadius: 2,
  },
};
