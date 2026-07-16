
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onSignUp: () => void;
}

const VerificationSteps = [
  { id: "01", label: "Upload Document" },
  { id: "02", label: "Hash Generated" },
  { id: "03", label: "Chain Queried" },
  { id: "04", label: "Proof Returned" },
];

export const HeroSection = ({ onSignUp }: HeroSectionProps) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <section className={`relative w-full min-h-screen overflow-hidden ${styles.section}`}>
      {/* Grid overlay */}
      <div className={`absolute inset-0 pointer-events-none ${styles.gridOverlay}`} />

      {/* Top-left corner bracket */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className={styles.bracketTopLeft} />
      </div>
      {/* Bottom-right corner bracket */}
      <div className="absolute bottom-8 right-8 pointer-events-none">
        <div style={{ width: 32, height: 32, borderBottom: "2px solid #00dc96", borderRight: "2px solid #00dc96" }} />
      </div>

      {/* Radial glow */}
      <div className={`absolute pointer-events-none ${styles.radialGlow}`} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col lg:flex-row items-start gap-20">
        {/* LEFT: Text content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Pill badge */}
          <div className={`inline-flex items-center gap-2 self-start ${styles.pillBadge}`}>
            <span className={styles.pillDot} />
            <span className={styles.pillText}>
              STELLAR SOROBAN — MAINNET
            </span>
          </div>

          {/* Headline */}
          <div>
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
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button onClick={onSignUp} className={styles.btnPrimary}>
              VERIFY A DOCUMENT →
            </button>
            <button className={styles.btnSecondary} onClick={() => router.push("/issuer")}>
              ISSUER PORTAL
            </button>
          </div>

          {/* Stats row */}
          <div className="flex gap-10 pt-4">
            {[
              { value: "100%", label: "Tamper-Proof" },
              { value: "<3s", label: "Verify Time" },
              { value: "0", label: "Central Servers" },
            ].map((stat) => (
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
        <div className={`flex-shrink-0 w-full lg:w-96 ${styles.card}`}>
          {/* Card top bar */}
          <div className="flex items-center justify-between mb-6">
            <span className={styles.cardTopLabel}>
              PROOF_VERIFICATION.SYS
            </span>
            <div className="flex gap-2">
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>

          {/* Fake file upload area */}
          <div className={styles.uploadArea}>
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📄</div>
            <div className={styles.uploadFileName}>
              university_certificate.pdf
            </div>
            <div className={styles.uploadFileHash}>SHA-256 → 3f8a...c92d</div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-6">
            {VerificationSteps.map((step, i) => {
              const isDone = i < activeStep;
              const isActive = i === activeStep;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={`${styles.stepIcon} ${isDone ? styles.stepIconDone : isActive ? styles.stepIconActive : styles.stepIconPending}`}>
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
                    <div className={styles.stepBarBg}>
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
          <div className={`${styles.resultBox} ${verified ? styles.resultBoxVerified : styles.resultBoxPending}`}>
            <div className={`${styles.resultDot} ${verified ? styles.resultDotVerified : styles.resultDotPending}`} />
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
          <div className={styles.cornerAccent} />
        </div>
      </div>
    </section>
  );
};