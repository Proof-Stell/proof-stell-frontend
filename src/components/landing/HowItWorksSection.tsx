import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { HOW_IT_WORKS_FLOWS, SECTION_IDS } from "@/config/landingContent";

export default function HowItWorksSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section
      id={SECTION_IDS.HOW_IT_WORKS}
      style={{
        background: "#060d0a",
        borderTop: "1px solid rgba(0,220,150,0.06)",
        padding: "96px 24px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Grid bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,220,150,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,150,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse, rgba(0,220,150,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 72 }}
        >
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
              PROTOCOL FLOWS
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
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
              How It Works.
              <br />
              <span style={{ color: "#00dc96" }}>Step by Step.</span>
            </h2>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#3a6050",
                maxWidth: 340,
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              Two core flows — document verification and credential issuance —
              both anchored entirely on Soroban smart contracts.
            </p>
          </div>
        </motion.div>

        {/* Flows */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
            gap: 32,
          }}
        >
          {HOW_IT_WORKS_FLOWS.map((flow, fi) => (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: fi * 0.1 }}
              style={{
                background: "rgba(0,18,12,0.7)",
                border: "1px solid rgba(0,220,150,0.1)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {/* Flow header */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid rgba(0,220,150,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(0,220,150,0.03)",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: flow.color,
                    boxShadow: `0 0 8px ${flow.color}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    color: flow.color,
                    fontWeight: 700,
                  }}
                >
                  {flow.title.toUpperCase()}
                </span>
              </div>

              {/* Steps */}
              <div style={{ padding: "24px" }}>
                {flow.steps.map((step, si) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: fi * 0.1 + si * 0.08 }}
                    style={{
                      display: "flex",
                      gap: 16,
                      paddingBottom: si < flow.steps.length - 1 ? 20 : 0,
                      marginBottom: si < flow.steps.length - 1 ? 20 : 0,
                      borderBottom:
                        si < flow.steps.length - 1
                          ? "1px solid rgba(0,220,150,0.06)"
                          : "none",
                    }}
                  >
                    {/* Step number + connector */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          border: `1px solid ${flow.color}50`,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.55rem",
                          color: flow.color,
                          fontFamily: "'Space Mono', monospace",
                          background: `${flow.color}08`,
                          flexShrink: 0,
                        }}
                      >
                        {step.n}
                      </div>
                      {si < flow.steps.length - 1 && (
                        <div
                          style={{
                            width: 1,
                            flex: 1,
                            minHeight: 20,
                            background: `linear-gradient(${flow.color}30, transparent)`,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#b0d8c8",
                          marginBottom: 6,
                          lineHeight: 1.3,
                        }}
                      >
                        {step.title}
                      </div>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: "#3a6050",
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {step.body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
