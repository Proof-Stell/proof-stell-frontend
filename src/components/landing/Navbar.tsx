"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

interface NavbarProps {
  onLoginClick: () => void;
}

const NAV_LINKS = [
  { label: "Verify", href: "/#verify" },
  { label: "Credentials", href: "/#credentials" },
  { label: "Issuers", href: "/#issuers" },
  { label: "How It Works", href: "/#how-it-works" },
];

export function Navbar({ onLoginClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ["verify", "credentials", "issuers", "how-it-works"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 90 && rect.bottom >= 90) {
            setActiveSection(id);
            return;
          }
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Mono:wght@400;500&display=swap');

        .proofstell-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: all 0.3s ease;
          font-family: 'DM Mono', 'Courier New', monospace;
        }

        .proofstell-nav.scrolled {
          background: rgba(6, 10, 16, 0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0, 220, 150, 0.12);
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.4);
        }

        .proofstell-nav.top {
          background: transparent;
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-mark {
          width: 32px;
          height: 32px;
          border: 1.5px solid #00dc96;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .logo-mark::before {
          content: '';
          position: absolute;
          inset: 3px;
          background: rgba(0, 220, 150, 0.15);
        }

        .logo-mark-inner {
          width: 8px;
          height: 8px;
          background: #00dc96;
          position: relative;
          z-index: 1;
          box-shadow: 0 0 10px #00dc96;
        }

        .logo-text {
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          font-size: 1rem;
          color: #e8f5f0;
          letter-spacing: 0.04em;
        }

        .logo-text span {
          color: #00dc96;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          text-decoration: none;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          color: #5a8a7a;
          transition: color 0.2s;
          position: relative;
          font-family: 'DM Mono', monospace;
        }

        .nav-link:hover {
          color: #e8f5f0;
        }

        .nav-link.active {
          color: #00dc96;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 16px;
          right: 16px;
          height: 1px;
          background: #00dc96;
          box-shadow: 0 0 6px #00dc96;
        }

        .nav-cta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-connect {
          background: transparent;
          border: 1px solid rgba(0, 220, 150, 0.4);
          color: #00dc96;
          padding: 8px 20px;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-connect:hover {
          background: rgba(0, 220, 150, 0.08);
          border-color: #00dc96;
          box-shadow: 0 0 16px rgba(0, 220, 150, 0.2);
        }

        .wallet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00dc96;
          box-shadow: 0 0 6px #00dc96;
          animation: walletPulse 2s infinite;
        }

        @keyframes walletPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .status-bar {
          background: rgba(0, 220, 150, 0.06);
          border-bottom: 1px solid rgba(0, 220, 150, 0.1);
          padding: 5px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.62rem;
          color: #3a6a5a;
          letter-spacing: 0.12em;
          font-family: 'DM Mono', monospace;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #00dc96;
          box-shadow: 0 0 4px #00dc96;
        }

        @media (max-width: 768px) {
          .nav-links, .status-bar { display: none; }
          .mobile-menu-btn { display: flex; }
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: 1px solid rgba(0, 220, 150, 0.3);
          border-radius: 2px;
          padding: 6px 10px;
          cursor: pointer;
          color: #00dc96;
          font-size: 1rem;
        }

        .mobile-menu {
          display: none;
          flex-direction: column;
          background: rgba(6, 10, 16, 0.98);
          border-bottom: 1px solid rgba(0, 220, 150, 0.12);
          padding: 16px 24px;
          gap: 4px;
        }

        .mobile-menu.open {
          display: flex;
        }

        .mobile-link {
          display: block;
          padding: 10px 0;
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: #5a8a7a;
          text-decoration: none;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(0, 220, 150, 0.06);
        }

        .mobile-link:last-child { border-bottom: none; }
      `}</style>

      <header className={`proofstell-nav ${scrolled ? "scrolled" : "top"}`}>
        {/* Status ticker */}
        <div className="status-bar">
          <div className="status-item">
            <div className="status-dot" />
            STELLAR NETWORK LIVE
          </div>
          <div className="status-item">
            <div className="status-dot" />
            SOROBAN RPC · CONNECTED
          </div>
          <div className="status-item">
            <div className="status-dot" />
            BLOCK #9,847,201
          </div>
        </div>

        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="logo-mark">
              <div className="logo-mark-inner" />
            </div>
            <span className="logo-text">
              Proof<span>Stell</span>
            </span>
          </Link>

          {/* Center links */}
          <ul className="nav-links">
            {NAV_LINKS.map((link) => {
              const id = link.href.replace("/#", "");
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`nav-link ${activeSection === id ? "active" : ""}`}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA */}
          <div className="nav-cta">
            <button className="btn-connect" onClick={onLoginClick}>
              <div className="wallet-dot" />
              CONNECT WALLET
            </button>
          </div>

          {/* Mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
          <button
            className="btn-connect"
            style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
            onClick={() => { onLoginClick(); setMenuOpen(false); }}
          >
            <div className="wallet-dot" />
            CONNECT WALLET
          </button>
        </div>
      </header>
    </>
  );
}