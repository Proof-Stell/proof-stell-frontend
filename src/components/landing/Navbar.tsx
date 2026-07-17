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
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Leaderboard", href: "/#leaderboard" },
  { label: "Testimonials", href: "/#testimonials" },
];

export function Navbar({ onLoginClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, error } = useWallet();

  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    setScrolled(window.scrollY > 20);

    const sections = ["features", "how-it-works", "leaderboard", "testimonials"];
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
    if (status === "connected") return;
    onLoginClick();
  };

  return (
    <>
      <header className={`${styles.proofstellNav} ${scrolled ? styles.scrolled : styles.top}`}>
        {/* Status ticker */}
        <div className={styles.statusBar} role="status" aria-label="Network Status Bar">
          <div className={styles.statusItem}>
            <div className={styles.statusDot} aria-hidden="true" />
            STELLAR NETWORK LIVE
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusDot} aria-hidden="true" />
            SOROBAN RPC · CONNECTED
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusDot} aria-hidden="true" />
            BLOCK #9,847,201
          </div>
        </div>

        <nav className={styles.navInner} aria-label="Main Navigation">
          {/* Logo */}
          <Link href="/" className={styles.navLogo} aria-label="ProofStell Home">
            <div className={styles.logoMark} aria-hidden="true">
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
              const isActive = activeSection === id;
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label.toUpperCase()}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA */}
          <div className={styles.navCta}>
            <button
              id="navbar-connect-wallet-btn"
              className={styles.btnConnect}
              onClick={handleConnectClick}
              disabled={status === "loading"}
              title={ctaTitle}
              aria-label={ctaLabel}
            >
              <div className={styles.walletDot} aria-hidden="true" />
              {ctaLabel}
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </nav>

        {/* Mobile menu */}
        <div 
          id="mobile-menu"
          className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
          aria-hidden={!menuOpen}
        >
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
            <div className={styles.walletDot} aria-hidden="true" />
            {ctaLabel}
          </button>

          {status === "error" && error && (
            <p style={{ color: "#ff6b6b", fontSize: 12, marginTop: 8, padding: "0 4px" }} role="alert">
              ⚠ {error.message}
            </p>
          )}
        </div>
      </header>
    </>
  );
}