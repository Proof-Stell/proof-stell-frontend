import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    id: "01",
    title: "On-Chain Document Proofs",
    tag: "CORE",
    description:
      "Institutions register documents by storing cryptographic hashes directly on Soroban smart contracts. Anyone can verify authenticity by comparing a file's hash with the immutable blockchain record.",
    accent: "#00dc96",
  },
  {
    id: "02",
    title: "Institutional Issuers",
    tag: "ISSUERS",
    description:
      "Verified institutions — universities, employers, NGOs — issue credentials directly to users' Stellar wallets. Certificates, employment letters, compliance approvals: all tamper-proof.",
    accent: "#00dc96",
  },
  {
    id: "03",
    title: "Wallet-Based Identity",
    tag: "IDENTITY",
    description:
      "No usernames. No passwords. Connect your Stellar wallet to receive credentials, share verifiable proofs, and manage all issued documents. Self-sovereign by design.",
    accent: "#00dc96",
  },
  {
    id: "04",
    title: "Instant Verification",
    tag: "VERIFY",
    description:
      "Upload a document — the platform hashes it, queries the Soroban contract, and returns a result in seconds. Valid, Not Found, or Revoked. No intermediary required.",
    accent: "#00dc96",
  },
  {
    id: "05",
    title: "Revocation Registry",
    tag: "REGISTRY",
    description:
      "Issuers can revoke credentials on-chain — fraudulent certificates, expired compliance docs, recalled licenses. Revocation state is permanently transparent and auditable.",
    accent: "#00dc96",
  },
  {
    id: "06",
    title: "Trustless Infrastructure",
    tag: "PROTOCOL",
    description:
      "Built entirely on Soroban smart contracts. No centralized databases, no trusted third parties. ProofStell anchors cryptographic proofs on Stellar — permanent and globally verifiable.",
    accent: "#00dc96",
  },
];

const FeatureCard = ({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(0,20,14,0.95)" : "rgba(0,12,8,0.6)",
        border: `1px solid ${hovered ? "rgba(0,220,150,0.35)" : "rgba(0,220,150,0.1)"}`,
        borderRadius: 3,
        padding: "28px 28px 24px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 8px 40px rgba(0,220,150,0.08)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Corner accent top-right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 40,
          height: 40,
          borderTop: `1.5px solid ${hovered ? "#00dc96" : "rgba(0,220,150,0.2)"}`,
          borderRight: `1.5px solid ${hovered ? "#00dc96" : "rgba(0,220,150,0.2)"}`,
          transition: "border-color 0.3s",
        }}
      />

      {/* Bottom glow on hover */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, #00dc96, transparent)",
          }}
        />
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.18em",
            color: "#00dc96",
            background: "rgba(0,220,150,0.08)",
            border: "1px solid rgba(0,220,150,0.2)",
            padding: "3px 10px",
            borderRadius: 1,
          }}
        >
          {feature.tag}
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(0,220,150,0.25)",
            letterSpacing: "0.05em",
          }}
        >
          /{feature.id}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: hovered ? "#e8f5f0" : "#a0c4b8",
          margin: 0,
          lineHeight: 1.35,
          transition: "color 0.3s",
          letterSpacing: "-0.01em",
        }}
      >
        {feature.title}
      </h3>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: hovered
            ? "linear-gradient(90deg, #00dc96, transparent)"
            : "rgba(0,220,150,0.08)",
          transition: "background 0.4s",
        }}
      />

      {/* Description */}
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.78rem",
          color: "#4a7060",
          lineHeight: 1.75,
          margin: 0,
          transition: "color 0.3s",
          ...(hovered ? { color: "#6a9a88" } : {}),
        }}
      >
        {feature.description}
      </p>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      id="features"
      style={{
        background: "#060a10",
        padding: "96px 24px",
        position: "relative",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Grid bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,220,150,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,220,150,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64 }}
        >
          {/* Label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 24,
                height: 1,
                background: "#00dc96",
                boxShadow: "0 0 8px #00dc96",
              }}
            />
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: "#00dc96",
              }}
            >
              PLATFORM CAPABILITIES
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h2
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                fontWeight: 700,
                color: "#e8f5f0",
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              Cryptographic Trust,<br />
              <span style={{ color: "#00dc96" }}>Without the Middleman.</span>
            </h2>
            <p
              style={{
                color: "#3a6050",
                fontSize: "0.8rem",
                maxWidth: 320,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Six core capabilities anchored on Stellar Soroban — from credential issuance to instant on-chain revocation.
            </p>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <FeatureCard key={f.id} feature={f} index={i} />
          ))}
        </div>

        {/* Bottom stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            marginTop: 56,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Contracts Deployed", value: "4" },
            { label: "Avg Verify Time", value: "<3s" },
            { label: "Trust Model", value: "Zero" },
            { label: "Network", value: "Stellar" },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: "1 1 160px",
                padding: "20px 24px",
                border: "1px solid rgba(0,220,150,0.1)",
                background: "rgba(0,12,8,0.4)",
                ...(i === 0 ? { borderRadius: "3px 0 0 3px" } : {}),
                ...(i === 3 ? { borderRadius: "0 3px 3px 0" } : {}),
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "#e8f5f0",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  color: "#3a6050",
                  letterSpacing: "0.1em",
                  marginTop: 4,
                }}
              >
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;