import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./FeaturesSection.module.css";

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
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${styles.card} ${hovered ? styles.cardHover : styles.cardDefault}`}
    >
      {/* Corner accent top-right */}
      <div className={`${styles.cardCorner} ${hovered ? styles.cardCornerHover : styles.cardCornerDefault}`} aria-hidden="true" />

      {/* Bottom glow on hover */}
      {hovered && <div className={styles.cardBottomGlow} aria-hidden="true" />}

      {/* Header row */}
      <div className={styles.cardHeaderFlex}>
        <span className={styles.cardTag}>
          {feature.tag}
        </span>
        <span className={styles.cardId} aria-hidden="true">
          /{feature.id}
        </span>
      </div>

      {/* Title */}
      <h3 className={`${styles.cardTitle} ${hovered ? styles.cardTitleHover : styles.cardTitleDefault}`}>
        {feature.title}
      </h3>

      {/* Divider */}
      <div className={`${styles.cardDivider} ${hovered ? styles.cardDividerHover : styles.cardDividerDefault}`} aria-hidden="true" />

      {/* Description */}
      <p className={`${styles.cardDesc} ${hovered ? styles.cardDescHover : styles.cardDescDefault}`}>
        {feature.description}
      </p>
    </motion.li>
  );
};

const FeaturesSection: React.FC = () => {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section id="features" className={styles.section} style={{ scrollMarginTop: 100 }} aria-labelledby="features-heading">
      {/* Grid bg */}
      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.contentWrapper}>
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64 }}
        >
          {/* Label */}
          <div className={styles.headerLabelWrapper}>
            <div className={styles.headerLabelLine} aria-hidden="true" />
            <span className={styles.headerLabelText}>
              PLATFORM CAPABILITIES
            </span>
          </div>

          <div className={styles.headerFlex}>
            <h2 id="features-heading" className={styles.headline}>
              Cryptographic Trust,<br />
              <span style={{ color: "#00dc96" }}>Without the Middleman.</span>
            </h2>
            <p className={styles.subheadline}>
              Six core capabilities anchored on Stellar Soroban — from credential issuance to instant on-chain revocation.
            </p>
          </div>
        </motion.div>

        {/* Feature grid */}
        <ul className={styles.grid} aria-label="Platform feature details">
          {features.map((f, i) => (
            <FeatureCard key={f.id} feature={f} index={i} />
          ))}
        </ul>

        {/* Bottom stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={styles.statsRow}
          role="region"
          aria-label="Operational Statistics"
        >
          {[
            { label: "Contracts Deployed", value: "4" },
            { label: "Avg Verify Time", value: "<3s" },
            { label: "Trust Model", value: "Zero" },
            { label: "Network", value: "Stellar" },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`${styles.statItem} ${i === 0 ? styles.statItemFirst : ''} ${i === 3 ? styles.statItemLast : ''}`}
            >
              <div className={styles.statValue}>
                {s.value}
              </div>
              <div className={styles.statLabel}>
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