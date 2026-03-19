
import { useEffect, useRef, useState } from "react";

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
  const [activeStep, setActiveStep] = useState(0);
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === VerificationSteps.length - 1) {
          setVerified(true);
          clearInterval(intervalRef.current!);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(intervalRef.current!);
  }, []);

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      style={{
        background: "#060a10",
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,220,150,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,220,150,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top-left corner bracket */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div style={{ width: 32, height: 32, borderTop: "2px solid #00dc96", borderLeft: "2px solid #00dc96" }} />
      </div>
      {/* Bottom-right corner bracket */}
      <div className="absolute bottom-8 right-8 pointer-events-none">
        <div style={{ width: 32, height: 32, borderBottom: "2px solid #00dc96", borderRight: "2px solid #00dc96" }} />
      </div>

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "60vh",
          background: "radial-gradient(ellipse at center, rgba(0,180,120,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col lg:flex-row items-start gap-20">
        {/* LEFT: Text content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Pill badge */}
          <div
            className="inline-flex items-center gap-2 self-start"
            style={{
              border: "1px solid rgba(0,220,150,0.3)",
              borderRadius: 2,
              padding: "5px 14px",
              background: "rgba(0,220,150,0.06)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#00dc96",
                boxShadow: "0 0 8px #00dc96",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ color: "#00dc96", fontSize: 11, letterSpacing: "0.15em", fontWeight: 600 }}>
              STELLAR SOROBAN — MAINNET
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1
              style={{
                fontFamily: "'Space Mono', 'DM Mono', monospace",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                fontWeight: 700,
                color: "#e8f5f0",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Document Truth,
              <br />
              <span style={{ color: "#00dc96" }}>Anchored On-Chain.</span>
            </h1>
            <p
              style={{
                marginTop: "1.5rem",
                color: "#7a9e92",
                fontSize: "1.05rem",
                lineHeight: 1.75,
                maxWidth: 480,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ProofStell replaces centralized trust with cryptographic proof.
              Institutions issue tamper-proof credentials directly to wallets.
              Anyone can verify in seconds — no middleman, no databases.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onSignUp}
              style={{
                background: "#00dc96",
                color: "#060a10",
                border: "none",
                borderRadius: 2,
                padding: "14px 32px",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "#00f5ab";
                (e.target as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(0,220,150,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "#00dc96";
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              VERIFY A DOCUMENT →
            </button>
            <button
              style={{
                background: "transparent",
                color: "#00dc96",
                border: "1px solid rgba(0,220,150,0.35)",
                borderRadius: 2,
                padding: "14px 32px",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = "#00dc96";
                (e.target as HTMLButtonElement).style.background = "rgba(0,220,150,0.07)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = "rgba(0,220,150,0.35)";
                (e.target as HTMLButtonElement).style.background = "transparent";
              }}
            >
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
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: "#e8f5f0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#4a6b60", fontSize: "0.72rem", letterSpacing: "0.1em", marginTop: 2 }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Live verification simulation card */}
        <div
          className="flex-shrink-0 w-full lg:w-96"
          style={{
            border: "1px solid rgba(0,220,150,0.18)",
            borderRadius: 4,
            background: "rgba(0,15,10,0.7)",
            backdropFilter: "blur(12px)",
            padding: "28px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Card top bar */}
          <div className="flex items-center justify-between mb-6">
            <span style={{ color: "#4a6b60", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
              PROOF_VERIFICATION.SYS
            </span>
            <div className="flex gap-2">
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>

          {/* Fake file upload area */}
          <div
            style={{
              border: "1px dashed rgba(0,220,150,0.25)",
              borderRadius: 3,
              padding: "18px",
              marginBottom: 24,
              background: "rgba(0,220,150,0.03)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📄</div>
            <div style={{ color: "#e8f5f0", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace" }}>
              university_certificate.pdf
            </div>
            <div style={{ color: "#4a6b60", fontSize: "0.65rem", marginTop: 4 }}>SHA-256 → 3f8a...c92d</div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-6">
            {VerificationSteps.map((step, i) => {
              const isDone = i < activeStep;
              const isActive = i === activeStep;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 2,
                      border: `1px solid ${isDone ? "#00dc96" : isActive ? "rgba(0,220,150,0.6)" : "rgba(0,220,150,0.15)"}`,
                      background: isDone ? "rgba(0,220,150,0.15)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.4s",
                      boxShadow: isDone ? "0 0 10px rgba(0,220,150,0.2)" : "none",
                    }}
                  >
                    {isDone ? (
                      <span style={{ color: "#00dc96", fontSize: 12, fontWeight: 700 }}>✓</span>
                    ) : (
                      <span style={{ color: isActive ? "#00dc96" : "#2a4a40", fontSize: "0.6rem" }}>{step.id}</span>
                    )}
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1">
                    <div
                      style={{
                        color: isDone ? "#e8f5f0" : isActive ? "#a0cfc0" : "#2a4a40",
                        fontSize: "0.75rem",
                        fontFamily: "'Space Mono', monospace",
                        marginBottom: 4,
                        transition: "color 0.4s",
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        height: 2,
                        background: "rgba(0,220,150,0.1)",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: isDone ? "100%" : isActive ? "60%" : "0%",
                          background: "#00dc96",
                          borderRadius: 1,
                          transition: "width 0.8s ease",
                          boxShadow: "0 0 8px #00dc96",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result */}
          <div
            style={{
              borderRadius: 3,
              padding: "14px 18px",
              background: verified ? "rgba(0,220,150,0.08)" : "rgba(0,220,150,0.02)",
              border: `1px solid ${verified ? "rgba(0,220,150,0.4)" : "rgba(0,220,150,0.1)"}`,
              transition: "all 0.5s",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: verified ? "#00dc96" : "#1a3028",
                boxShadow: verified ? "0 0 12px #00dc96" : "none",
                flexShrink: 0,
                transition: "all 0.5s",
              }}
            />
            <div>
              <div
                style={{
                  color: verified ? "#00dc96" : "#2a4a40",
                  fontSize: "0.75rem",
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                  transition: "color 0.5s",
                }}
              >
                {verified ? "✓ CREDENTIAL VERIFIED" : "AWAITING RESULT..."}
              </div>
              {verified && (
                <div style={{ color: "#4a6b60", fontSize: "0.62rem", marginTop: 3 }}>
                  Issued by: University of Lagos · Block #9,847,201
                </div>
              )}
            </div>
          </div>

          {/* Corner accent */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 60,
              height: 60,
              background: "radial-gradient(circle at bottom right, rgba(0,220,150,0.12), transparent)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
};