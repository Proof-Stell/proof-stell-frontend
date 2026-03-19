import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  org: string;
  type: "issuer" | "verifier" | "user";
  hash: string;
  txBlock: string;
}

const testimonials: Testimonial[] = [
  {
    id: "0x3f8a",
    quote:
      "We issue hundreds of certificates a month. ProofStell eliminated fraud inquiries entirely — every employer can verify directly on-chain without calling us.",
    name: "Dr. Amara Osei",
    role: "Registrar",
    org: "University of Accra",
    type: "issuer",
    hash: "3f8a...c92d",
    txBlock: "#9,841,002",
  },
  {
    id: "0x7b2c",
    quote:
      "I verified a candidate's engineering certificate in under three seconds. No email chains, no PDF forgeries. This is how hiring should work.",
    name: "Kenji Watanabe",
    role: "Head of Engineering",
    org: "Meridian Labs",
    type: "verifier",
    hash: "7b2c...f14a",
    txBlock: "#9,843,551",
  },
  {
    id: "0x1d9e",
    quote:
      "My credentials live in my Stellar wallet. I share a proof link with anyone who needs verification — no waiting, no middlemen, no data leaks.",
    name: "Fatima Al-Rashid",
    role: "Compliance Officer",
    org: "Independent",
    type: "user",
    hash: "1d9e...a87b",
    txBlock: "#9,845,790",
  },
  {
    id: "0xc41f",
    quote:
      "We revoked an expired certification on-chain in one transaction. The status updated globally, instantly. Our legal team was impressed.",
    name: "Priya Menon",
    role: "Director of Ops",
    org: "NovaCert Authority",
    type: "issuer",
    hash: "c41f...0e3d",
    txBlock: "#9,846,120",
  },
  {
    id: "0x9a3b",
    quote:
      "Auditing compliance documents used to take days. With ProofStell's on-chain revocation registry, I can check any credential's status in real time.",
    name: "Marcus Eze",
    role: "Lead Auditor",
    org: "TrustFrame Partners",
    type: "verifier",
    hash: "9a3b...d25c",
    txBlock: "#9,847,019",
  },
];

const TYPE_LABELS: Record<Testimonial["type"], string> = {
  issuer: "CREDENTIAL ISSUER",
  verifier: "THIRD-PARTY VERIFIER",
  user: "WALLET HOLDER",
};

const TYPE_COLORS: Record<Testimonial["type"], string> = {
  issuer: "#00dc96",
  verifier: "#38bdf8",
  user: "#a78bfa",
};

const TestimonialCard = ({
  testimonial,
  isCenter,
}: {
  testimonial: Testimonial;
  isCenter: boolean;
}) => {
  const color = TYPE_COLORS[testimonial.type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        background: isCenter ? "rgba(0,18,12,0.95)" : "rgba(0,10,6,0.5)",
        border: `1px solid ${isCenter ? `${color}55` : "rgba(0,220,150,0.08)"}`,
        borderRadius: 3,
        padding: isCenter ? "32px" : "24px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.4s",
        opacity: isCenter ? 1 : 0.45,
        transform: isCenter ? "scale(1)" : "scale(0.95)",
        boxShadow: isCenter ? `0 0 40px ${color}14` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: 280,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Top accent line */}
      {isCenter && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
      )}

      {/* Type badge + block */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            color,
            background: `${color}12`,
            border: `1px solid ${color}30`,
            padding: "3px 10px",
            borderRadius: 1,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {TYPE_LABELS[testimonial.type]}
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.15)",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {testimonial.txBlock}
        </span>
      </div>

      {/* Quote */}
      <blockquote
        style={{
          margin: 0,
          fontSize: "0.82rem",
          lineHeight: 1.8,
          color: isCenter ? "#b0d8c8" : "#3a5a50",
          fontStyle: "italic",
          flex: 1,
          transition: "color 0.3s",
        }}
      >
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* User */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingTop: 16,
          borderTop: "1px solid rgba(0,220,150,0.08)",
        }}
      >
        {/* Avatar block */}
        <div
          style={{
            width: 36,
            height: 36,
            border: `1px solid ${isCenter ? `${color}60` : "rgba(0,220,150,0.1)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: isCenter ? `${color}10` : "transparent",
          }}
        >
          <span style={{ color, fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
            {testimonial.name.split(" ").map((n) => n[0]).join("")}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isCenter ? "#e8f5f0" : "#3a5a50",
              fontFamily: "'Space Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {testimonial.name}
          </div>
          <div style={{ fontSize: "0.62rem", color: "#3a5a50", marginTop: 1 }}>
            {testimonial.role} · {testimonial.org}
          </div>
        </div>

        {/* Hash */}
        <div
          style={{
            fontSize: "0.58rem",
            color: "rgba(0,220,150,0.2)",
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}
        >
          {testimonial.hash}
        </div>
      </div>
    </motion.div>
  );
};

const TestimonialsSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerRef = useRef(null);

  const total = testimonials.length;

  useEffect(() => {
    if (!autoPlay) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 4500);
    return () => clearInterval(intervalRef.current!);
  }, [autoPlay, total]);

  const prev = () => {
    setCurrent((c) => (c - 1 + total) % total);
  };

  const next = () => {
    setCurrent((c) => (c + 1) % total);
  };

  // Show 3 cards: left, center (active), right
  const getIdx = (offset: number) => (current + offset + total) % total;

  return (
    <section
      id="testimonials"
      style={{
        background: "#060a10",
        borderTop: "1px solid rgba(0,220,150,0.08)",
        padding: "96px 24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
      }}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Mono:wght@400;500&display=swap');
      `}</style>

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "50vh",
          background: "radial-gradient(ellipse, rgba(0,220,150,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 24, height: 1, background: "#00dc96", boxShadow: "0 0 8px #00dc96" }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: "#00dc96" }}>
                VERIFIED TESTIMONIALS
              </span>
            </div>
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
              Trust, From Both<br />
              <span style={{ color: "#00dc96" }}>Sides of the Chain.</span>
            </h2>
          </div>

          {/* Nav controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={prev}
              style={{
                width: 40,
                height: 40,
                border: "1px solid rgba(0,220,150,0.2)",
                background: "transparent",
                color: "#00dc96",
                borderRadius: 2,
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,220,150,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#00dc96";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,220,150,0.2)";
              }}
            >
              ←
            </button>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "#3a6050", padding: "0 8px" }}>
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              onClick={next}
              style={{
                width: 40,
                height: 40,
                border: "1px solid rgba(0,220,150,0.2)",
                background: "transparent",
                color: "#00dc96",
                borderRadius: 2,
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,220,150,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#00dc96";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,220,150,0.2)";
              }}
            >
              →
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr 1fr",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <AnimatePresence mode="popLayout">
            {[-1, 0, 1].map((offset) => (
              <TestimonialCard
                key={`${getIdx(offset)}-${offset}`}
                testimonial={testimonials[getIdx(offset)]}
                isCenter={offset === 0}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 6,
                height: 6,
                borderRadius: 3,
                border: "none",
                background: i === current ? "#00dc96" : "rgba(0,220,150,0.15)",
                cursor: "pointer",
                transition: "all 0.3s",
                padding: 0,
                boxShadow: i === current ? "0 0 8px #00dc96" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;