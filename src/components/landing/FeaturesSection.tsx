import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FEATURES, FEATURE_STATS, SECTION_IDS } from "@/config/landingContent";
import type { Feature } from "@/config/landingContent";
import styles from "./FeaturesSection.module.css";

const FeatureCard = ({
  feature,
  index,
}: {
  feature: Feature;
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
    <section id={SECTION_IDS.FEATURES} className={styles.section} aria-labelledby="features-heading">
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
          {FEATURES.map((f, i) => (
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
          {FEATURE_STATS.map((s, i) => (
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