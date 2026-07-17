"use client";

import { useState, useEffect } from "react";

const SECTION_IDS = ["features", "how-it-works", "leaderboard", "testimonials"];

export function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerOffset = 100;

      let current = "";

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY - headerOffset;
          if (top <= scrollY) {
            current = id;
          }
        }
      }

      setActiveSection(current);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return activeSection;
}
