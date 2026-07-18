import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "./HeroSection.module.css";
import { VerificationSteps } from "@/lib/mockData";
import { env } from "@/config/environment";
import { HERO_STATS } from "@/config/landingContent";

interface HeroSectionProps {
  onSignUp: () => void;
}

export const HeroSection = ({ onSignUp }: HeroSectionProps) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If mock data is disabled, we might want to skip the simulation or show a different UI.
  // Given the requirement, I'll just keep the simulation but maybe wrap it in a conditional or just keep it as is if it's explicitly enabled.
  // The issue says "Replace hard-coded... with a state-driven flow".
  
  const showMock = env.NEXT_PUBLIC_ENABLE_MOCK_DATA;

  useEffect(() => {
    if (!showMock) return;

    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === VerificationSteps.length - 1) {
          setVerified(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showMock]);

  return (
    <section className={`relative w-full min-h-screen overflow-hidden ${styles.section}`} aria-label="Introduction">
      {/* Grid overlay */}
      <div className={`absolute inset-0 pointer-events-none ${styles.gridOverlay}`} aria-hidden="true" />

      {/* Top-left corner bracket */}
      <div className="absolute top-8 left-8 pointer-events-none" aria-hidden="true">
        <div className={styles.bracketTopLeft} />
      </div>
      {/* Bottom-right corner bracket */}
      <div className="absolute bottom-8 right-8 pointer-events-none" aria-hidden="true">
        <div style={{ width: 32, height: 32, borderBottom: "2px solid #00dc96", borderRight: "2px solid #00dc96" }} />
      </div>

      {/* Radial glow */}
      <div className={`absolute pointer-events-none ${styles.radialGlow}`} aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col lg:flex-row items-start gap-20">
        {/* LEFT: Text content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Pill badge */}
          <div className={`inline-flex items-center gap-2 self-start ${styles.pillBadge}`} role="status" aria-label="Network Environment: Stellar Soroban Mainnet">
            <span className={styles.pillDot} aria-hidden="true" />
            <span className={styles.pillText}>
              STELLAR SOROBAN — MAINNET
            </span>
          </div>

          {/* Headline */}
          <header>
            <h1 className={styles.headline}>
              Document Truth,
              <br />
              <span style={{ color: "#00dc96" }}>Anchored On-Chain.</span>
            </h1>
            <p className={styles.subheadline}>
              ProofStell replaces centralized trust with cryptographic proof.
              Institutions issue tamper-proof credentials directly to wallets.
              Anyone can verify in seconds — no middleman, no databases.
            </p>
          </header>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button type="button" onClick={onSignUp} className={styles.btnPrimary} aria-label="Verify a document now">
              VERIFY A DOCUMENT <span aria-hidden="true">→</span>
            </button>
            <button className={styles.btnSecondary} onClick={() => router.push("/issuer")}>
              ISSUER PORTAL
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-10 pt-4" role="region" aria-label="Platform Statistics">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <div className={styles.statValue}>
                  {stat.value}
                </div>
                <div className={styles.statLabel}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Live verification simulation card */}
        <div 
          className={`flex-shrink-0 w-full lg:w-96 ${styles.card}`}
          role="region"
          aria-label="Live Verification Demo Simulation"
        >
          {/* Card top bar */}
          <div className="flex items-center justify-between mb-6">
            <span className={styles.cardTopLabel}>
              {showMock ? "PROOF_VERIFICATION.SYS (PREVIEW)" : "PROOF_VERIFICATION.SYS"}
            </span>
            <div className="flex gap-2" aria-hidden="true">
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>

          {/* Fake file upload area */}
          <div className={styles.uploadArea}>
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }} aria-hidden="true">📄</div>
            <div className={styles.uploadFileName}>
              university_certificate.pdf
            </div>
            <div className={styles.uploadFileHash} aria-label="Cryptographic hash of the document">SHA-256 → 3f8a...c92d</div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-6" role="status" aria-live="polite" aria-label="Verification progress">
            {VerificationSteps.map((step, i) => {
              const isDone = i < activeStep;
              const isActive = i === activeStep;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Icon */}
                  <div 
                    className={`${styles.stepIcon} ${isDone ? styles.stepIconDone : isActive ? styles.stepIconActive : styles.stepIconPending}`}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <span style={{ color: "#00dc96", fontSize: 12, fontWeight: 700 }}>✓</span>
                    ) : (
                      <span style={{ color: isActive ? "#00dc96" : "#2a4a40", fontSize: "0.6rem" }}>{step.id}</span>
                    )}
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1">
                    <div className={`${styles.stepLabel} ${isDone ? styles.stepLabelDone : isActive ? styles.stepLabelActive : styles.stepLabelPending}`}>
                      {step.label}
                    </div>
                    <div className={styles.stepBarBg} aria-hidden="true">
                      <div
                        className={styles.stepBarFill}
                        style={{ width: isDone ? "100%" : isActive ? "60%" : "0%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          <div 
            className={`${styles.resultBox} ${verified ? styles.resultBoxVerified : styles.resultBoxPending}`}
            role="status"
            aria-live="assertive"
          >
            <div className={`${styles.resultDot} ${verified ? styles.resultDotVerified : styles.resultDotPending}`} aria-hidden="true" />
            <div>
              <div className={`${styles.resultText} ${verified ? styles.resultTextVerified : styles.resultTextPending}`}>
                {verified ? "✓ CREDENTIAL VERIFIED" : "AWAITING RESULT..."}
              </div>
              {verified && (
                <div className={styles.resultDetails}>
                  Issued by: University of Lagos · Block #9,847,201
                </div>
              )}
            </div>
          </div>

          {/* Corner accent */}
          <div className={styles.cornerAccent} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};