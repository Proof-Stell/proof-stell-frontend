import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TESTIMONIALS,
  TESTIMONIAL_TYPE_LABELS,
  TESTIMONIAL_TYPE_COLORS,
  SECTION_IDS,
} from "@/config/landingContent";
import type { Testimonial } from "@/config/landingContent";

const TestimonialCard = ({
  testimonial,
  isCenter,
  offset,
}: {
  testimonial: Testimonial;
  isCenter: boolean;
  offset: number;
}) => {
  const color = TESTIMONIAL_TYPE_COLORS[testimonial.type];

  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`testimonial-card ${isCenter ? "active-card" : "inactive-card"}`}
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
        display: offset !== 0 ? "none" : "flex", // Media query overrides below in inline-style tag
        flexDirection: "column",
        gap: 20,
        minHeight: 280,
        fontFamily: "'DM Mono', monospace",
        margin: 0,
      }}
    >
      {/* Top accent line */}
      {isCenter && (
        <div
          aria-hidden="true"
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
          {TESTIMONIAL_TYPE_LABELS[testimonial.type]}
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

      {/* User Figcaption Metadata */}
      <figcaption
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
          aria-hidden="true"
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
          aria-label={`Transaction cryptographic hash: ${testimonial.hash}`}
        >
          {testimonial.hash}
        </div>
      </figcaption>
    </motion.figure>
  );
};

const TestimonialsSection: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerRef = useRef(null);

  const total = TESTIMONIALS.length;

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

  const getIdx = (offset: number) => (current + offset + total) % total;

  return (
    <section
      id={SECTION_IDS.TESTIMONIALS}
      style={{
        background: "#060a10",
        borderTop: "1px solid rgba(0,220,150,0.08)",
        padding: "96px 24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
        scrollMarginTop: 100,
      }}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
      onFocus={() => setAutoPlay(false)}
      onBlur={() => setAutoPlay(true)}
      aria-labelledby="testimonials-heading"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Mono:wght@400;500&display=swap');
        
        /* Mobile-first and desktop media queries for layout stability */
        .testimonial-grid-track {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          align-items: stretch;
        }

        @media (min-width: 768px) {
          .testimonial-grid-track {
            grid-template-columns: 1fr 1.15fr 1fr;
          }
          .testimonial-card {
            display: flex !important;
          }
        }
      `}</style>

      {/* Radial glow background */}
      <div
        aria-hidden="true"
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
              <div aria-hidden="true" style={{ width: 24, height: 1, background: "#00dc96", boxShadow: "0 0 8px #00dc96" }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", color: "#00dc96" }}>
                VERIFIED TESTIMONIALS
              </span>
            </div>
            <h2
              id="testimonials-heading"
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} role="group" aria-label="Carousel Controls">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
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
            <span 
              style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "#3a6050", padding: "0 8px" }}
              aria-live="polite"
              aria-atomic="true"
            >
              {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              onClick={next}
              aria-label="Next testimonial"
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

        {/* Cards container track */}
        <div className="testimonial-grid-track" role="region" aria-label="Testimonial slider">
          <AnimatePresence mode="popLayout">
            {[-1, 0, 1].map((offset) => (
              <TestimonialCard
                key={`${getIdx(offset)}-${offset}`}
                testimonial={TESTIMONIALS[getIdx(offset)]}
                isCenter={offset === 0}
                offset={offset}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }} role="tablist" aria-label="Testimonial slides selection">
          {TESTIMONIALS.map((_, i) => {
            const isSelected = i === current;
            return (
              <button
                key={i}
                role="tab"
                aria-selected={isSelected}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                style={{
                  width: isSelected ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: "none",
                  background: isSelected ? "#00dc96" : "rgba(0,220,150,0.15)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  padding: 0,
                  boxShadow: isSelected ? "0 0 8px #00dc96" : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;