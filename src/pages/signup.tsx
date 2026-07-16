import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@/components/providers";

type Step = "choose" | "connecting" | "success" | "error";

const WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    description: "Official Stellar browser extension wallet",
    badge: "RECOMMENDED",
    icon: "🔑",
  },
  {
    id: "xbull",
    name: "xBull",
    description: "Multi-feature Stellar wallet extension",
    badge: null,
    icon: "🐂",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { status, error: walletError } = useWallet();
  const [step, setStep] = useState<Step>("choose");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already connected via provider context, skip straight to success
  React.useEffect(() => {
    if (status === "connected") {
      setStep("success");
    }
  }, [status]);

  const handleConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setStep("connecting");
    setLocalError(null);

    try {
      type BrowserWin = Window & typeof globalThis & Record<string, unknown>;
      type WalletProvider = { connect?: () => Promise<unknown> } & Record<string, unknown>;
      const win = window as BrowserWin;
      let provider: WalletProvider | null = null;

      if (walletId === "freighter") {
        provider =
          (win["freighter"] ?? win["freighterApi"] ?? win["freighterClient"] ?? null) as WalletProvider | null;
        if (!provider) throw new Error("Freighter extension not found. Please install it from freighter.app and refresh.");
        if (typeof provider.connect === "function") await provider.connect();
      } else if (walletId === "xbull") {
        provider = (win["xBullSDK"] ?? win["xbull"] ?? null) as WalletProvider | null;
        if (!provider) throw new Error("xBull extension not found. Please install xBull and refresh.");
      } else {
        throw new Error(`Unknown wallet: ${walletId}`);
      }

      setStep("success");
    } catch (err: unknown) {
      setLocalError((err as Error)?.message ?? "Connection failed. Please try again.");
      setStep("error");
    }
  };

  const displayError = localError ?? walletError?.message ?? null;

  return (
    <>
      <Head>
        <title>Connect Wallet — ProofStell</title>
      </Head>

      <div style={styles.page}>
        {/* Grid overlay */}
        <div style={styles.gridOverlay} />
        {/* Radial glow */}
        <div style={styles.radialGlow} />

        <div style={styles.container}>
          {/* Back link */}
          <Link href="/" style={styles.backLink}>
            ← BACK TO HOME
          </Link>

          {/* Logo */}
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>
              <div style={styles.logoMarkInner} />
            </div>
            <span style={styles.logoText}>
              Proof<span style={{ color: "#00dc96" }}>Stell</span>
            </span>
          </div>

          {/* Card */}
          <div style={styles.card}>
            {/* Top accent */}
            <div style={styles.cardAccent} />

            {step === "choose" && (
              <>
                <p style={styles.sysLabel}>WALLET_AUTH.SYS</p>
                <h1 style={styles.heading}>Connect Your Wallet</h1>
                <p style={styles.subtext}>
                  No email. No password. Your Stellar wallet is your identity.
                  Choose a wallet to get started.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
                  {WALLETS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleConnect(w.id)}
                      style={styles.walletBtn}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#00dc96";
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,220,150,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,220,150,0.15)";
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <span style={styles.walletIcon}>{w.icon}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={styles.walletName}>{w.name}</span>
                          {w.badge && (
                            <span style={styles.badge}>{w.badge}</span>
                          )}
                        </div>
                        <p style={styles.walletDesc}>{w.description}</p>
                      </div>
                      <span style={{ color: "#00dc96", fontSize: "1rem" }}>→</span>
                    </button>
                  ))}
                </div>

                <p style={styles.disclaimer}>
                  By connecting, you agree to interact with the Stellar blockchain.
                  ProofStell never stores your private keys.
                </p>
              </>
            )}

            {step === "connecting" && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={styles.spinner} />
                <p style={styles.connectingLabel}>CONNECTING TO {selectedWallet?.toUpperCase()}…</p>
                <p style={styles.subtext}>Check your wallet extension for a connection prompt.</p>
              </div>
            )}

            {step === "success" && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={{ ...styles.heading, marginTop: 16 }}>Wallet Connected</h2>
                <p style={styles.subtext}>
                  Your Stellar wallet is linked. You can now access your credentials,
                  verify documents, and manage your identity on-chain.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
                  <button
                    onClick={() => router.push("/dashboard")}
                    style={styles.primaryBtn}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00c488")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00dc96")}
                  >
                    VIEW MY CREDENTIALS →
                  </button>
                  <button
                    onClick={() => router.push("/verify")}
                    style={styles.secondaryBtn}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#00dc96";
                      (e.currentTarget as HTMLButtonElement).style.color = "#00dc96";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,220,150,0.3)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#3a8060";
                    }}
                  >
                    VERIFY A DOCUMENT
                  </button>
                </div>
              </div>
            )}

            {step === "error" && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={styles.errorIcon}>✕</div>
                <h2 style={{ ...styles.heading, marginTop: 16 }}>Connection Failed</h2>
                {displayError && (
                  <p style={styles.errorText}>{displayError}</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
                  <button
                    onClick={() => { setStep("choose"); setLocalError(null); }}
                    style={styles.primaryBtn}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00c488")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00dc96")}
                  >
                    TRY AGAIN
                  </button>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.secondaryBtn, display: "block", textAlign: "center", textDecoration: "none" }}
                  >
                    INSTALL FREIGHTER WALLET ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Security note */}
          <p style={styles.securityNote}>
            🔒 All authentication is wallet-signature based (SEP-0010). No passwords stored.
          </p>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#060d0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', 'Space Mono', monospace",
    position: "relative",
    overflow: "hidden",
    padding: "40px 16px",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,220,150,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  radialGlow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60vw",
    height: "60vh",
    background: "radial-gradient(ellipse, rgba(0,220,150,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
  },
  backLink: {
    alignSelf: "flex-start",
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
    color: "#3a6050",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    border: "2px solid #00dc96",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkInner: {
    width: 10,
    height: 10,
    background: "#00dc96",
    transform: "rotate(45deg)",
  },
  logoText: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#e8f5f0",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.05em",
  },
  card: {
    width: "100%",
    background: "rgba(0,18,12,0.95)",
    border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 3,
    padding: "36px 32px",
    position: "relative",
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: "linear-gradient(90deg, transparent, #00dc96, transparent)",
  },
  sysLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.2em",
    color: "#00dc96",
    marginBottom: 12,
    margin: "0 0 12px 0",
  },
  heading: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e8f5f0",
    margin: "0 0 8px 0",
    letterSpacing: "-0.02em",
  },
  subtext: {
    fontSize: "0.78rem",
    color: "#5a8070",
    lineHeight: 1.7,
    margin: "8px 0 0 0",
  },
  walletBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 2,
    padding: "16px 18px",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#e8f5f0",
    fontFamily: "'DM Mono', monospace",
  },
  walletIcon: {
    fontSize: "1.4rem",
    flexShrink: 0,
  },
  walletName: {
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#e8f5f0",
    fontFamily: "'Space Mono', monospace",
  },
  badge: {
    fontSize: "0.5rem",
    letterSpacing: "0.15em",
    color: "#00dc96",
    background: "rgba(0,220,150,0.1)",
    border: "1px solid rgba(0,220,150,0.3)",
    padding: "2px 6px",
    borderRadius: 1,
  },
  walletDesc: {
    fontSize: "0.67rem",
    color: "#3a6050",
    margin: "2px 0 0 0",
  },
  disclaimer: {
    fontSize: "0.62rem",
    color: "#2a4a3a",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 1.6,
  },
  spinner: {
    width: 48,
    height: 48,
    border: "2px solid rgba(0,220,150,0.15)",
    borderTop: "2px solid #00dc96",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  connectingLabel: {
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    color: "#00dc96",
    marginBottom: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    border: "2px solid #00dc96",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: "#00dc96",
    margin: "0 auto",
    background: "rgba(0,220,150,0.08)",
    boxShadow: "0 0 24px rgba(0,220,150,0.2)",
  },
  errorIcon: {
    width: 64,
    height: 64,
    border: "2px solid #ff6b6b",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    color: "#ff6b6b",
    margin: "0 auto",
    background: "rgba(255,107,107,0.08)",
  },
  errorText: {
    fontSize: "0.75rem",
    color: "#ff6b6b",
    marginTop: 12,
    lineHeight: 1.6,
    background: "rgba(255,107,107,0.06)",
    border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 2,
    padding: "10px 14px",
  },
  primaryBtn: {
    width: "100%",
    background: "#00dc96",
    border: "none",
    color: "#000",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    padding: "14px 24px",
    cursor: "pointer",
    borderRadius: 2,
    transition: "background 0.2s",
  },
  secondaryBtn: {
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(0,220,150,0.3)",
    color: "#3a8060",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    padding: "14px 24px",
    cursor: "pointer",
    borderRadius: 2,
    transition: "all 0.2s",
  },
  securityNote: {
    fontSize: "0.62rem",
    color: "#2a4a3a",
    textAlign: "center",
    letterSpacing: "0.05em",
  },
};
