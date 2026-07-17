import React from "react";
import Link from "next/link";
import { FOOTER_LINKS } from "@/config/landingContent";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#030806",
        borderTop: "1px solid rgba(0,220,150,0.08)",
        padding: "72px 24px 40px",
        fontFamily: "'DM Mono', 'Space Mono', monospace",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Top row: logo + links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr repeat(3, 1fr)",
            gap: 48,
            marginBottom: 64,
          }}
        >
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: "2px solid #00dc96",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    background: "#00dc96",
                    transform: "rotate(45deg)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#e8f5f0",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Proof<span style={{ color: "#00dc96" }}>Stell</span>
              </span>
            </div>

            <p
              style={{
                fontSize: "0.7rem",
                color: "#3a6050",
                lineHeight: 1.8,
                margin: "0 0 20px 0",
                maxWidth: 240,
              }}
            >
              Decentralized document verification anchored on Stellar Soroban.
              Tamper-proof credentials for a trustless world.
            </p>

            {/* Status pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "STELLAR MAINNET", status: "LIVE" },
                { label: "SOROBAN RPC", status: "ACTIVE" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#00dc96",
                      boxShadow: "0 0 6px #00dc96",
                    }}
                  />
                  <span style={{ fontSize: "0.55rem", letterSpacing: "0.12em", color: "#3a6050" }}>
                    {item.label} ·{" "}
                    <span style={{ color: "#00dc96" }}>{item.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, items]) => (
            <div key={section}>
              <div
                style={{
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  color: "#00dc96",
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(0,220,150,0.1)",
                }}
              >
                {section.toUpperCase()}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) =>
                  "external" in item && item.external ? (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color = "#00dc96")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color = "#3a6050")
                        }
                      >
                        {item.label} ↗
                      </a>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        style={linkStyle}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color = "#b0d8c8")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLAnchorElement).style.color = "#3a6050")
                        }
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,220,150,0.12), transparent)",
            marginBottom: 32,
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: "0.6rem",
              color: "#2a4a3a",
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            © {new Date().getFullYear()} ProofStell · MIT License · Built on Stellar
          </p>
          <p
            style={{
              fontSize: "0.6rem",
              color: "#2a4a3a",
              margin: 0,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Simple access to decentralized verification.
          </p>
        </div>
      </div>
    </footer>
  );
}

const linkStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  color: "#3a6050",
  textDecoration: "none",
  transition: "color 0.2s",
  display: "block",
};
