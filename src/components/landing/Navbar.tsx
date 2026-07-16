"use client";

import Link from "next/link";
import React, { useCallback, useState } from "react";
import { useEventListener } from "../../hooks/useEventListener";
import { useWallet } from "../providers";
import styles from "./Navbar.module.css";

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
  const { status, error } = useWallet();

  const handleScroll = useCallback(() => {
    // Guard against server-side or pre-mount invocation
    if (typeof window === "undefined") return;
    setScrolled(window.scrollY > 20);

    const sections = ["verify", "credentials", "issuers", "how-it-works"];
    for (const id of sections) {
      if (typeof document === "undefined") continue;
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
  }, []);

  useEventListener("scroll", handleScroll);

  /** Derive CTA label from wallet context state */
  const ctaLabel =
    status === "loading"
      ? "CONNECTING…"
      : status === "connected"
      ? "WALLET CONNECTED"
      : status === "error"
      ? "WALLET UNAVAILABLE"
      : "CONNECT WALLET";

  const ctaTitle =
    status === "error" && error ? error.message : undefined;

  const handleConnectClick = () => {
    if (status === "connected") return; // already connected, no-op
    onLoginClick();
  };

  return (
    <>
      <header className={`${styles.proofstellNav} ${scrolled ? styles.scrolled : styles.top}`}>
        {/* Status ticker */}
        <div className={styles.statusBar}>
          <div className={styles.statusItem}>
            <div className={styles.statusDot} />
            STELLAR NETWORK LIVE
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusDot} />
            SOROBAN RPC · CONNECTED
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusDot} />
            BLOCK #9,847,201
          </div>
        </div>

        <div className={styles.navInner}>
          {/* Logo */}
          <Link href="/" className={styles.navLogo}>
            <div className={styles.logoMark}>
              <div className={styles.logoMarkInner} />
            </div>
            <span className={styles.logoText}>
              Proof<span>Stell</span>
            </span>
          </Link>

          {/* Center links */}
          <ul className={styles.navLinks}>
            {NAV_LINKS.map((link) => {
              const id = link.href.replace("/#", "");
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${activeSection === id ? styles.active : ""}`}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA — reflects wallet connection state */}
          <div className={styles.navCta}>
            <button
              id="navbar-connect-wallet-btn"
              className={styles.btnConnect}
              onClick={handleConnectClick}
              disabled={status === "loading"}
              title={ctaTitle}
              aria-label={ctaLabel}
            >
              <div className={styles.walletDot} />
              {ctaLabel}
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
          <button
            id="mobile-connect-wallet-btn"
            className={styles.btnConnect}
            style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
            onClick={() => { handleConnectClick(); setMenuOpen(false); }}
            disabled={status === "loading"}
            title={ctaTitle}
            aria-label={ctaLabel}
          >
            <div className={styles.walletDot} />
            {ctaLabel}
          </button>

          {/* Inline error message for mobile users */}
          {status === "error" && error && (
            <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8, padding: "0 4px" }}>
              ⚠ {error.message}
            </p>
          )}
        </div>
      </header>
    </>
  );
}