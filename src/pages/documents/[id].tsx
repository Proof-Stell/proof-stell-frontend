import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { getCredentialById, type CredentialDetail, type VerificationStatus } from "@/lib/api/proofstell";
import { shortHash } from "@/utils/hash";

const STATUS_CFG: Record<
  VerificationStatus,
  { label: string; color: string; icon: string }
> = {
  valid:     { label: "VALID",     color: "#00dc96", icon: "✓" },
  revoked:   { label: "REVOKED",   color: "#ef4444", icon: "✕" },
  expired:   { label: "EXPIRED",   color: "#f59e0b", icon: "!" },
  not_found: { label: "NOT FOUND", color: "#5a8070", icon: "?" },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={s.copyBtn}>
      {copied ? "COPIED ✓" : "COPY"}
    </button>
  );
}

export default function CredentialDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [cred, setCred] = useState<CredentialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCredentialById(id)
      .then((data) => { setCred(data); setLoading(false); })
      .catch((e) => { setError(e.message ?? "Failed to load credential"); setLoading(false); });
  }, [id]);

  const st = cred ? STATUS_CFG[cred.status] : null;

  return (
    <>
      <Head>
        <title>{cred ? `${cred.title} — ProofStell` : "Credential — ProofStell"}</title>
      </Head>

      <div style={s.page}>
        <div style={s.grid} />
        <div style={s.glow} />

        {/* Nav */}
        <header style={s.header}>
          <Link href="/" style={s.navLogo}>
            <div style={s.logoMark}><div style={s.logoInner} /></div>
            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e8f5f0", fontFamily: "'Space Mono', monospace" }}>
              Proof<span style={{ color: "#00dc96" }}>Stell</span>
            </span>
          </Link>
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/dashboard" style={s.navLink}>DASHBOARD</Link>
            <Link href="/verify" style={s.navLink}>VERIFY</Link>
          </nav>
        </header>

        <div style={s.body}>
          {/* Back */}
          <button onClick={() => router.back()} style={s.backBtn}>← BACK</button>

          {loading && (
            <div style={s.centered}>
              <div style={s.spinner} />
              <p style={s.loadingText}>LOADING CREDENTIAL…</p>
            </div>
          )}

          {error && (
            <div style={s.errorBox}>⚠ {error}</div>
          )}

          {!loading && !error && cred && st && (
            <div style={s.content}>
              {/* Hero header card */}
              <div style={s.heroCard}>
                <div style={s.heroAccent} />

                {/* Status badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <span style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3a6050", background: "rgba(0,220,150,0.06)", border: "1px solid rgba(0,220,150,0.1)", padding: "2px 10px", borderRadius: 1 }}>
                    {cred.type.toUpperCase()}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${st.color}10`, border: `1px solid ${st.color}30`, borderRadius: 1, padding: "3px 10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.color, boxShadow: `0 0 6px ${st.color}` }} />
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: st.color, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{st.label}</span>
                  </div>
                </div>

                {/* Title */}
                <h1 style={s.heroTitle}>{cred.title}</h1>

                {/* Issuer row */}
                <div style={s.issuerRow}>
                  <div style={s.issuerAvatar}>
                    {cred.issuer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#e8f5f0", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                      {cred.issuer.name}
                      {cred.issuer.verified && <span style={{ marginLeft: 8, fontSize: "0.55rem", color: "#00dc96" }}>✓ VERIFIED ISSUER</span>}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#3a6050", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
                      {shortHash(cred.issuer.walletAddress, 8)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {cred.description && (
                  <p style={s.description}>{cred.description}</p>
                )}
              </div>

              <div style={s.twoCol}>
                {/* Left: Chain data */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* On-chain record */}
                  <div style={s.panel}>
                    <div style={s.panelHeader}>ON-CHAIN RECORD</div>
                    <div style={s.metaList}>
                      <MetaRow label="DOCUMENT HASH">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#5a8070", wordBreak: "break-all" }}>
                          {cred.hash}
                        </span>
                        <CopyButton value={cred.hash} />
                      </MetaRow>
                      {cred.txId && (
                        <MetaRow label="TX ID">
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#5a8070" }}>
                            {cred.txId}
                          </span>
                          <CopyButton value={cred.txId} />
                        </MetaRow>
                      )}
                      {cred.block && (
                        <MetaRow label="BLOCK">
                          <span style={{ fontSize: "0.75rem", color: "#b0d8c8" }}>#{cred.block.toLocaleString()}</span>
                        </MetaRow>
                      )}
                      <MetaRow label="ISSUED">
                        <span style={{ fontSize: "0.75rem", color: "#b0d8c8" }}>{fmt(cred.issuedAt)}</span>
                      </MetaRow>
                      {cred.expiresAt && (
                        <MetaRow label="EXPIRES">
                          <span style={{ fontSize: "0.75rem", color: cred.status === "expired" ? "#f59e0b" : "#b0d8c8" }}>
                            {fmt(cred.expiresAt)}
                          </span>
                        </MetaRow>
                      )}
                    </div>
                  </div>

                  {/* Recipient */}
                  <div style={s.panel}>
                    <div style={s.panelHeader}>RECIPIENT</div>
                    <div style={s.metaList}>
                      <MetaRow label="WALLET">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#5a8070", wordBreak: "break-all" }}>
                          {cred.recipientWallet}
                        </span>
                        <CopyButton value={cred.recipientWallet} />
                      </MetaRow>
                    </div>
                  </div>

                  {/* IPFS */}
                  {cred.ipfsCid && (
                    <div style={s.panel}>
                      <div style={s.panelHeader}>OFF-CHAIN METADATA</div>
                      <div style={s.metaList}>
                        <MetaRow label="IPFS CID">
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#5a8070" }}>
                            {cred.ipfsCid}
                          </span>
                          <a
                            href={`https://ipfs.io/ipfs/${cred.ipfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.55rem", color: "#00dc96", textDecoration: "none", flexShrink: 0 }}
                          >
                            VIEW ↗
                          </a>
                        </MetaRow>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Credential metadata */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.keys(cred.metadata).length > 0 && (
                    <div style={s.panel}>
                      <div style={s.panelHeader}>CREDENTIAL DETAILS</div>
                      <div style={s.metaList}>
                        {Object.entries(cred.metadata).map(([k, v]) => (
                          <MetaRow key={k} label={k.toUpperCase()}>
                            <span style={{ fontSize: "0.78rem", color: "#b0d8c8" }}>{v}</span>
                          </MetaRow>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verify shortcut */}
                  <div style={{ ...s.panel, background: "rgba(0,220,150,0.03)", borderColor: "rgba(0,220,150,0.2)" }}>
                    <div style={s.panelHeader}>INDEPENDENT VERIFICATION</div>
                    <p style={{ fontSize: "0.7rem", color: "#3a6050", lineHeight: 1.7, margin: "12px 0 16px" }}>
                      Anyone can independently verify this credential by uploading the
                      original document or pasting its hash into the verification tool.
                    </p>
                    <button
                      onClick={() => router.push(`/verify`)}
                      style={s.verifyBtn}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00c488")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00dc96")}
                    >
                      VERIFY THIS DOCUMENT →
                    </button>
                  </div>

                  {/* Credential ID */}
                  <div style={s.panel}>
                    <div style={s.panelHeader}>CREDENTIAL ID</div>
                    <div style={s.metaList}>
                      <MetaRow label="ID">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#5a8070" }}>{cred.id}</span>
                        <CopyButton value={cred.id} />
                      </MetaRow>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 12, borderBottom: "1px solid rgba(0,220,150,0.06)" }}>
      <span style={{ fontSize: "0.52rem", letterSpacing: "0.15em", color: "#2a4a3a" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#060d0a", fontFamily: "'DM Mono', 'Space Mono', monospace", position: "relative" },
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(0,220,150,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.025) 1px, transparent 1px)",
    backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0,
  },
  glow: {
    position: "fixed", top: "20%", right: "20%",
    width: "40vw", height: "40vh",
    background: "radial-gradient(ellipse, rgba(0,220,150,0.05) 0%, transparent 70%)",
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
  body: { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 },
  backBtn: { background: "transparent", border: "none", color: "#3a6050", fontFamily: "'Space Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", padding: 0, alignSelf: "flex-start" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: 16 },
  spinner: { width: 40, height: 40, border: "2px solid rgba(0,220,150,0.15)", borderTop: "2px solid #00dc96", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { fontSize: "0.65rem", letterSpacing: "0.15em", color: "#3a6050" },
  errorBox: { background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2, padding: "14px 18px", fontSize: "0.72rem", color: "#ef4444" },
  content: { display: "flex", flexDirection: "column", gap: 24 },
  heroCard: {
    background: "rgba(0,18,12,0.9)", border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 3, padding: "32px", position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column", gap: 20,
  },
  heroAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #00dc96, transparent)" },
  heroTitle: {
    fontFamily: "'Space Mono', monospace", fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
    fontWeight: 700, color: "#e8f5f0", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em",
  },
  issuerRow: { display: "flex", alignItems: "center", gap: 14 },
  issuerAvatar: {
    width: 40, height: 40, border: "1px solid rgba(0,220,150,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.65rem", fontWeight: 700, color: "#00dc96",
    background: "rgba(0,220,150,0.08)", fontFamily: "'Space Mono', monospace",
    flexShrink: 0,
  },
  description: { fontSize: "0.75rem", color: "#5a8070", lineHeight: 1.8, margin: 0 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" },
  panel: {
    background: "rgba(0,18,12,0.8)", border: "1px solid rgba(0,220,150,0.1)",
    borderRadius: 3, padding: "20px 22px",
  },
  panelHeader: {
    fontSize: "0.55rem", letterSpacing: "0.2em", color: "#00dc96",
    marginBottom: 16, paddingBottom: 10,
    borderBottom: "1px solid rgba(0,220,150,0.08)",
  },
  metaList: { display: "flex", flexDirection: "column", gap: 12 },
  verifyBtn: {
    background: "#00dc96", border: "none", color: "#000",
    fontFamily: "'Space Mono', monospace", fontWeight: 700,
    fontSize: "0.65rem", letterSpacing: "0.1em",
    padding: "11px 20px", cursor: "pointer", borderRadius: 2, transition: "background 0.2s",
    width: "100%",
  },
  copyBtn: {
    background: "transparent", border: "1px solid rgba(0,220,150,0.2)",
    color: "#3a6050", fontFamily: "'Space Mono', monospace",
    fontSize: "0.5rem", letterSpacing: "0.1em",
    padding: "2px 8px", cursor: "pointer", borderRadius: 1, flexShrink: 0,
  },
};
