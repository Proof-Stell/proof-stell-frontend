import React, { useCallback, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { hashFile, shortHash } from "@/utils/hash";
import {
  verifyDocumentHash,
  type VerificationResult,
  type VerificationStatus,
} from "@/lib/api/proofstell";

type PageState = "idle" | "hashing" | "verifying" | "done" | "error";

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bg: string; icon: string; detail: string }
> = {
  valid: {
    label: "CREDENTIAL VERIFIED",
    color: "#00dc96",
    bg: "rgba(0,220,150,0.06)",
    icon: "✓",
    detail: "This document matches an authentic on-chain record.",
  },
  not_found: {
    label: "NOT FOUND ON-CHAIN",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    icon: "?",
    detail: "No matching record found. This document may not have been registered.",
  },
  revoked: {
    label: "CREDENTIAL REVOKED",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.06)",
    icon: "✕",
    detail: "This credential has been revoked by the issuing institution.",
  },
  expired: {
    label: "CREDENTIAL EXPIRED",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    icon: "!",
    detail: "This credential existed but has passed its expiry date.",
  },
};

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VerifyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [manualHash, setManualHash] = useState("");
  const [pageState, setPageState] = useState<PageState>("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "paste">("upload");

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setHash(null);
    setResult(null);
    setErrorMsg(null);
    setPageState("hashing");
    try {
      const h = await hashFile(f);
      setHash(h);
      setPageState("idle");
    } catch {
      setErrorMsg("Failed to hash file. Please try a different file.");
      setPageState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleVerify = async () => {
    const hashToCheck = mode === "upload" ? hash : manualHash.trim();
    if (!hashToCheck) return;

    setPageState("verifying");
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await verifyDocumentHash(hashToCheck);
      setResult(res);
      setPageState("done");
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message ?? "Verification failed. Please try again.");
      setPageState("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setHash(null);
    setManualHash("");
    setResult(null);
    setErrorMsg(null);
    setPageState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isVerifying = pageState === "verifying";
  const canVerify =
    !isVerifying &&
    (mode === "upload" ? !!hash : manualHash.trim().length === 64);

  const statusCfg = result ? STATUS_CONFIG[result.status] : null;

  return (
    <>
      <Head>
        <title>Verify Document — ProofStell</title>
      </Head>

      <div style={s.page}>
        <div style={s.gridOverlay} />
        <div style={s.radialGlow} />

        <div style={s.layout}>
          {/* Sidebar */}
          <aside style={s.sidebar}>
            <Link href="/" style={s.backLink}>← HOME</Link>
            <div style={s.sidebarLogo}>
              <div style={s.logoMark}><div style={s.logoMarkInner} /></div>
              <span style={s.logoText}>Proof<span style={{ color: "#00dc96" }}>Stell</span></span>
            </div>
            <h1 style={s.sidebarHeading}>Document Verification</h1>
            <p style={s.sidebarDesc}>
              Upload any document to instantly check whether it has been
              registered and verified on the Stellar blockchain.
            </p>
            <div style={s.stepsList}>
              {[
                { n: "01", t: "Upload Document", active: mode === "upload" && pageState === "idle" && !hash },
                { n: "02", t: "Hash Generated", active: !!hash || mode === "paste" },
                { n: "03", t: "Chain Queried", active: pageState === "verifying" },
                { n: "04", t: "Result Returned", active: pageState === "done" },
              ].map((step) => (
                <div key={step.n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    border: `1px solid ${step.active ? "#00dc96" : "rgba(0,220,150,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.55rem",
                    color: step.active ? "#00dc96" : "#2a4a3a",
                    flexShrink: 0,
                    background: step.active ? "rgba(0,220,150,0.08)" : "transparent",
                    transition: "all 0.3s",
                  }}>
                    {step.n}
                  </div>
                  <span style={{ fontSize: "0.68rem", color: step.active ? "#b0d8c8" : "#3a6050", transition: "color 0.3s" }}>
                    {step.t}
                  </span>
                </div>
              ))}
            </div>
          </aside>

          {/* Main panel */}
          <main style={s.main}>
            {/* Mode toggle */}
            <div style={s.modeToggle}>
              <button
                onClick={() => { setMode("upload"); handleReset(); }}
                style={{ ...s.modeBtn, ...(mode === "upload" ? s.modeBtnActive : {}) }}
              >
                UPLOAD FILE
              </button>
              <button
                onClick={() => { setMode("paste"); handleReset(); }}
                style={{ ...s.modeBtn, ...(mode === "paste" ? s.modeBtnActive : {}) }}
              >
                PASTE HASH
              </button>
            </div>

            {/* Upload mode */}
            {mode === "upload" && (
              <>
                <div
                  style={{
                    ...s.dropzone,
                    ...(dragOver ? s.dropzoneOver : {}),
                    ...(file ? s.dropzoneHasFile : {}),
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  aria-label="Upload document for verification"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  {!file ? (
                    <>
                      <div style={s.uploadIcon}>📄</div>
                      <p style={s.uploadTitle}>Drop document here or click to browse</p>
                      <p style={s.uploadHint}>PDF, DOCX, TXT, PNG, JPG — hashed client-side, never uploaded</p>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={s.uploadIcon}>📄</div>
                      <p style={s.uploadTitle}>{file.name}</p>
                      <p style={s.uploadHint}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  )}
                </div>

                {/* Hash display */}
                {(hash || pageState === "hashing") && (
                  <div style={s.hashBox}>
                    <span style={s.hashLabel}>SHA-256</span>
                    {pageState === "hashing" ? (
                      <span style={{ color: "#3a8060", fontSize: "0.75rem" }}>Computing…</span>
                    ) : (
                      <span style={s.hashValue} title={hash ?? ""}>{hash}</span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Paste mode */}
            {mode === "paste" && (
              <div>
                <label style={s.inputLabel}>PASTE SHA-256 HASH</label>
                <textarea
                  value={manualHash}
                  onChange={(e) => setManualHash(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. 3f8ac92d1b4e6f0a2d8b5c9e7f1a3d6e8f2b4c6a9d1e3f5b7c9e1a3d5f7b9c1"
                  style={s.textarea}
                  rows={3}
                  spellCheck={false}
                />
                {manualHash.length > 0 && manualHash.length !== 64 && (
                  <p style={s.inputError}>A valid SHA-256 hash is exactly 64 hex characters ({manualHash.length}/64).</p>
                )}
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={!canVerify}
              style={{
                ...s.verifyBtn,
                ...(!canVerify ? s.verifyBtnDisabled : {}),
              }}
            >
              {isVerifying ? "QUERYING BLOCKCHAIN…" : "VERIFY ON-CHAIN →"}
            </button>

            {/* Error */}
            {pageState === "error" && errorMsg && (
              <div style={s.errorBox}>
                <span style={{ color: "#ef4444" }}>⚠</span> {errorMsg}
              </div>
            )}

            {/* Result */}
            {pageState === "done" && result && statusCfg && (
              <div style={{ ...s.resultCard, background: statusCfg.bg, borderColor: `${statusCfg.color}30` }}>
                <div style={s.resultHeader}>
                  <div style={{ ...s.resultIcon, color: statusCfg.color, borderColor: `${statusCfg.color}60`, background: `${statusCfg.color}10` }}>
                    {statusCfg.icon}
                  </div>
                  <div>
                    <div style={{ ...s.resultStatus, color: statusCfg.color }}>{statusCfg.label}</div>
                    <div style={s.resultDetail}>{statusCfg.detail}</div>
                  </div>
                </div>

                {result.credential && (
                  <div style={s.resultMeta}>
                    <div style={s.metaRow}>
                      <span style={s.metaKey}>DOCUMENT</span>
                      <span style={s.metaVal}>{result.credential.title}</span>
                    </div>
                    <div style={s.metaRow}>
                      <span style={s.metaKey}>TYPE</span>
                      <span style={s.metaVal}>{result.credential.type}</span>
                    </div>
                    <div style={s.metaRow}>
                      <span style={s.metaKey}>ISSUER</span>
                      <span style={s.metaVal}>
                        {result.issuer?.name}
                        {result.issuer?.verified && (
                          <span style={{ marginLeft: 6, color: "#00dc96", fontSize: "0.6rem" }}>✓ VERIFIED</span>
                        )}
                      </span>
                    </div>
                    <div style={s.metaRow}>
                      <span style={s.metaKey}>ISSUED</span>
                      <span style={s.metaVal}>{formatDate(result.issuedAt)}</span>
                    </div>
                    {result.block && (
                      <div style={s.metaRow}>
                        <span style={s.metaKey}>BLOCK</span>
                        <span style={s.metaVal}>#{result.block.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={s.metaRow}>
                      <span style={s.metaKey}>HASH</span>
                      <span style={{ ...s.metaVal, fontFamily: "'DM Mono', monospace", fontSize: "0.65rem" }}>
                        {shortHash(result.hash, 8)}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  {result.credential && (
                    <button
                      onClick={() => router.push(`/documents/${result.credential!.id}`)}
                      style={s.resultActionBtn}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00c488")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#00dc96")}
                    >
                      VIEW CREDENTIAL →
                    </button>
                  )}
                  <button onClick={handleReset} style={s.resultResetBtn}>
                    VERIFY ANOTHER
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
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
    overflow: "hidden",
  },
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,220,150,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.025) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  radialGlow: {
    position: "fixed",
    top: "20%",
    left: "30%",
    width: "50vw",
    height: "50vh",
    background: "radial-gradient(ellipse, rgba(0,220,150,0.05) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  layout: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    gap: 48,
    padding: "60px 24px",
    alignItems: "flex-start",
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    position: "sticky",
    top: 60,
  },
  backLink: {
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#3a6050",
    textDecoration: "none",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logoMark: {
    width: 22,
    height: 22,
    border: "2px solid #00dc96",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkInner: {
    width: 8,
    height: 8,
    background: "#00dc96",
    transform: "rotate(45deg)",
  },
  logoText: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#e8f5f0",
    fontFamily: "'Space Mono', monospace",
  },
  sidebarHeading: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "1rem",
    fontWeight: 700,
    color: "#e8f5f0",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  sidebarDesc: {
    fontSize: "0.7rem",
    color: "#3a6050",
    lineHeight: 1.7,
    margin: 0,
  },
  stepsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTop: "1px solid rgba(0,220,150,0.08)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    minWidth: 0,
  },
  modeToggle: {
    display: "flex",
    gap: 0,
    border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 2,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  modeBtn: {
    background: "transparent",
    border: "none",
    color: "#3a6050",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    padding: "8px 18px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  modeBtnActive: {
    background: "rgba(0,220,150,0.08)",
    color: "#00dc96",
  },
  dropzone: {
    border: "1px dashed rgba(0,220,150,0.2)",
    borderRadius: 3,
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: "pointer",
    transition: "all 0.2s",
    background: "rgba(0,18,12,0.5)",
    minHeight: 180,
  },
  dropzoneOver: {
    borderColor: "#00dc96",
    background: "rgba(0,220,150,0.04)",
  },
  dropzoneHasFile: {
    borderColor: "rgba(0,220,150,0.4)",
    borderStyle: "solid",
    background: "rgba(0,220,150,0.04)",
  },
  uploadIcon: { fontSize: "2rem" },
  uploadTitle: {
    fontSize: "0.8rem",
    color: "#b0d8c8",
    margin: 0,
    textAlign: "center",
    fontFamily: "'Space Mono', monospace",
  },
  uploadHint: {
    fontSize: "0.65rem",
    color: "#3a6050",
    margin: 0,
    textAlign: "center",
  },
  hashBox: {
    background: "rgba(0,18,12,0.8)",
    border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 2,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  hashLabel: {
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
    color: "#00dc96",
    flexShrink: 0,
    background: "rgba(0,220,150,0.1)",
    border: "1px solid rgba(0,220,150,0.2)",
    padding: "2px 7px",
    borderRadius: 1,
  },
  hashValue: {
    fontSize: "0.65rem",
    color: "#3a8060",
    fontFamily: "'DM Mono', monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  inputLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#3a6050",
    display: "block",
    marginBottom: 8,
  },
  textarea: {
    width: "100%",
    background: "rgba(0,18,12,0.8)",
    border: "1px solid rgba(0,220,150,0.15)",
    borderRadius: 2,
    color: "#b0d8c8",
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.7rem",
    padding: "12px 14px",
    resize: "none",
    outline: "none",
    lineHeight: 1.6,
    boxSizing: "border-box",
  },
  inputError: {
    fontSize: "0.62rem",
    color: "#f59e0b",
    marginTop: 6,
  },
  verifyBtn: {
    background: "#00dc96",
    border: "none",
    color: "#000",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    padding: "14px 28px",
    cursor: "pointer",
    borderRadius: 2,
    alignSelf: "flex-start",
    transition: "background 0.2s",
  },
  verifyBtnDisabled: {
    background: "rgba(0,220,150,0.2)",
    color: "rgba(0,0,0,0.4)",
    cursor: "not-allowed",
  },
  errorBox: {
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 2,
    padding: "12px 16px",
    fontSize: "0.72rem",
    color: "#ef4444",
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  resultCard: {
    border: "1px solid",
    borderRadius: 3,
    padding: "24px",
  },
  resultHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  resultIcon: {
    width: 40,
    height: 40,
    border: "1px solid",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  resultStatus: {
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
  },
  resultDetail: {
    fontSize: "0.7rem",
    color: "#5a8070",
    marginTop: 4,
    lineHeight: 1.5,
  },
  resultMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 16,
    borderTop: "1px solid rgba(0,220,150,0.08)",
  },
  metaRow: {
    display: "flex",
    gap: 16,
    alignItems: "baseline",
  },
  metaKey: {
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
    color: "#3a6050",
    width: 80,
    flexShrink: 0,
  },
  metaVal: {
    fontSize: "0.75rem",
    color: "#b0d8c8",
    flex: 1,
  },
  resultActionBtn: {
    background: "#00dc96",
    border: "none",
    color: "#000",
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    padding: "10px 18px",
    cursor: "pointer",
    borderRadius: 2,
    transition: "background 0.2s",
  },
  resultResetBtn: {
    background: "transparent",
    border: "1px solid rgba(0,220,150,0.2)",
    color: "#3a8060",
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    padding: "10px 18px",
    cursor: "pointer",
    borderRadius: 2,
  },
};
