import React, { useEffect, useState } from "react";
import { useWallet } from "@/components/providers";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  getCredentialsByWallet,
  type CredentialSummary,
  type VerificationStatus,
} from "@/lib/api/proofstell";
import { shortHash } from "@/utils/hash";

// ── Status config ──────────────────────────────────────────────────────────

const STATUS: Record<VerificationStatus, { label: string; color: string; dot: string }> = {
  valid:     { label: "VALID",   color: "#00dc96", dot: "#00dc96" },
  revoked:   { label: "REVOKED", color: "#ef4444", dot: "#ef4444" },
  expired:   { label: "EXPIRED", color: "#f59e0b", dot: "#f59e0b" },
  not_found: { label: "UNKNOWN", color: "#5a8070", dot: "#5a8070" },
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}



// ── Credential card ────────────────────────────────────────────────────────

function CredCard({ cred, onClick }: { cred: CredentialSummary; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const st = STATUS[cred.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(0,220,150,0.04)" : "rgba(0,18,12,0.8)",
        border: `1px solid ${hovered ? "rgba(0,220,150,0.35)" : "rgba(0,220,150,0.1)"}`,
        borderRadius: 3,
        padding: "20px 22px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* top accent on hover */}
      {hovered && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #00dc96, transparent)" }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3a6050", background: "rgba(0,220,150,0.06)", border: "1px solid rgba(0,220,150,0.1)", padding: "2px 8px", borderRadius: 1 }}>
          {cred.type.toUpperCase()}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot, boxShadow: `0 0 6px ${st.dot}` }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: st.color, fontFamily: "'Space Mono', monospace" }}>{st.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: hovered ? "#e8f5f0" : "#b0d8c8", fontFamily: "'Space Mono', monospace", lineHeight: 1.3, transition: "color 0.2s" }}>
        {cred.title}
      </h3>

      {/* Issuer */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: "0.6rem", color: "#3a6050" }}>ISSUER</span>
        <span style={{ fontSize: "0.68rem", color: "#5a8070" }}>{cred.issuer.name}</span>
        {cred.issuer.verified && <span style={{ fontSize: "0.55rem", color: "#00dc96" }}>✓</span>}
      </div>

      {/* Footer row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(0,220,150,0.06)", marginTop: 2 }}>
        <span style={{ fontSize: "0.6rem", color: "#2a4a3a", fontFamily: "'DM Mono', monospace" }}>{shortHash(cred.hash, 6)}</span>
        <span style={{ fontSize: "0.6rem", color: "#2a4a3a" }}>{fmt(cred.issuedAt)}</span>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { status, walletAddress, logout } = useWallet();
  const [creds, setCreds] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status !== "connected" || !walletAddress) return;

    setLoading(true);
    getCredentialsByWallet(walletAddress)
      .then((data) => {
        setCreds(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message ?? "Failed to load credentials");
        setLoading(false);
      });
  }, [status, walletAddress]);

  const filtered = filter === "all" ? creds : creds.filter((c) => c.status === filter);

  const stats = {
    total: creds.length,
    valid: creds.filter((c) => c.status === "valid").length,
    revoked: creds.filter((c) => c.status === "revoked").length,
    expired: creds.filter((c) => c.status === "expired").length,
  };

  if (status === "loading" || status === "idle") {
    return (
      <>
        <Head><title>Loading Dashboard — ProofStell</title></Head>
        <div style={s.page}>
          <div style={s.grid} />
          <div style={s.glow} />
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
        <Head><title>Access Dashboard — ProofStell</title></Head>
        <div style={s.page}>
          <div style={s.grid} />
          <div style={s.glow} />
          
          <header style={s.header}>
            <Link href="/" style={s.navLogo}>
              <div style={s.logoMark}><div style={s.logoInner} /></div>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#e8f5f0", fontFamily: "'Space Mono', monospace" }}>
                Proof<span style={{ color: "#00dc96" }}>Stell</span>
              </span>
            </Link>
          </header>

          <div style={{ ...s.body, alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 120px)" }}>
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
                Please connect your Stellar wallet to view and manage your verified credentials on the blockchain registry.
              </p>
              <button onClick={() => router.push("/signup")} style={{ ...s.actionBtn, width: "100%" }}>
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
      <Head><title>Credential Dashboard — ProofStell</title></Head>

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
            <Link href="/verify" style={s.navLink}>VERIFY</Link>
            <Link href="/issuer" style={s.navLink}>ISSUER PORTAL</Link>
            <span style={{ ...s.navLink, color: "#00dc96", borderBottom: "1px solid #00dc96", paddingBottom: 2 }}>DASHBOARD</span>
            {status === "connected" && (
              <button 
                id="dashboard-logout-btn"
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

        <div style={s.body}>
          {/* Page title row */}
          <div style={s.titleRow}>
            <div>
              <div style={s.sysLabel}>CREDENTIAL_REGISTRY.SYS</div>
              <h1 style={s.pageTitle}>My Credentials</h1>
              <p style={s.walletAddr}>{walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => router.push("/verify")} style={s.actionBtn}>
                VERIFY DOC →
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div style={s.statsRow}>
            {[
              { label: "TOTAL", value: stats.total, color: "#e8f5f0" },
              { label: "VALID", value: stats.valid, color: "#00dc96" },
              { label: "REVOKED", value: stats.revoked, color: "#ef4444" },
              { label: "EXPIRED", value: stats.expired, color: "#f59e0b" },
            ].map((st, i) => (
              <div key={st.label} style={{ ...s.statItem, borderLeft: i > 0 ? "1px solid rgba(0,220,150,0.08)" : "none", paddingLeft: i > 0 ? 24 : 0 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: st.color, lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: "0.55rem", letterSpacing: "0.15em", color: "#3a6050", marginTop: 4 }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={s.filterRow}>
            {(["all", "valid", "revoked", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#3a6050", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
              LOADING CREDENTIALS…
            </div>
          )}

          {error && (
            <div style={s.errorBox}>⚠ {error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={s.emptyState}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>📭</div>
              <p style={{ fontFamily: "'Space Mono', monospace", color: "#b0d8c8", fontSize: "0.85rem", marginBottom: 8 }}>No credentials found</p>
              <p style={{ color: "#3a6050", fontSize: "0.7rem" }}>
                {filter !== "all" ? `No ${filter} credentials in this wallet.` : "This wallet has no issued credentials yet."}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={s.credGrid}>
              {filtered.map((c) => (
                <CredCard
                  key={c.id}
                  cred={c}
                  onClick={() => router.push(`/documents/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#060d0a",
    fontFamily: "'DM Mono', 'Space Mono', monospace",
    position: "relative",
  },
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: "linear-gradient(rgba(0,220,150,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.025) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none", zIndex: 0,
  },
  glow: {
    position: "fixed", top: "-10%", right: "10%",
    width: "50vw", height: "50vh",
    background: "radial-gradient(ellipse, rgba(0,220,150,0.04) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    position: "sticky", top: 0, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 40px", height: 60,
    background: "rgba(6,13,10,0.9)",
    borderBottom: "1px solid rgba(0,220,150,0.08)",
    backdropFilter: "blur(8px)",
  },
  navLogo: {
    display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
  },
  logoMark: {
    width: 22, height: 22, border: "2px solid #00dc96",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoInner: { width: 8, height: 8, background: "#00dc96", transform: "rotate(45deg)" },
  navLink: {
    fontSize: "0.6rem", letterSpacing: "0.12em", color: "#3a6050",
    textDecoration: "none", transition: "color 0.2s",
  },
  body: {
    position: "relative", zIndex: 1,
    maxWidth: 1100, margin: "0 auto",
    padding: "48px 24px",
    display: "flex", flexDirection: "column", gap: 32,
  },
  titleRow: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16,
  },
  sysLabel: {
    fontSize: "0.58rem", letterSpacing: "0.18em", color: "#00dc96", marginBottom: 8,
  },
  pageTitle: {
    fontFamily: "'Space Mono', monospace", fontSize: "1.8rem", fontWeight: 700,
    color: "#e8f5f0", margin: "0 0 6px 0", letterSpacing: "-0.02em",
  },
  walletAddr: {
    fontSize: "0.65rem", color: "#3a6050", margin: 0, fontFamily: "'DM Mono', monospace",
  },
  actionBtn: {
    background: "#00dc96", border: "none", color: "#000",
    fontFamily: "'Space Mono', monospace", fontWeight: 700,
    fontSize: "0.65rem", letterSpacing: "0.1em",
    padding: "10px 20px", cursor: "pointer", borderRadius: 2, transition: "background 0.2s",
  },
  statsRow: {
    display: "flex", gap: 0, alignItems: "stretch",
    background: "rgba(0,18,12,0.8)", border: "1px solid rgba(0,220,150,0.1)",
    borderRadius: 3, padding: "20px 28px",
  },
  statItem: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start",
  },
  filterRow: {
    display: "flex", gap: 0, borderBottom: "1px solid rgba(0,220,150,0.08)",
  },
  filterBtn: {
    background: "transparent", border: "none",
    borderBottom: "2px solid transparent",
    color: "#3a6050", fontFamily: "'Space Mono', monospace",
    fontSize: "0.6rem", letterSpacing: "0.12em",
    padding: "10px 18px", cursor: "pointer", transition: "all 0.2s",
    marginBottom: -1,
  },
  filterBtnActive: {
    color: "#00dc96", borderBottomColor: "#00dc96",
  },
  credGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  emptyState: {
    textAlign: "center", padding: "80px 0",
    border: "1px dashed rgba(0,220,150,0.1)", borderRadius: 3,
    color: "#3a6050",
  },
  errorBox: {
    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 2, padding: "14px 18px",
    fontSize: "0.72rem", color: "#ef4444",
  },
};
