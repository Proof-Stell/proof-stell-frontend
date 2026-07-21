"use client";
import { useState, useEffect } from "react";
import { SECTION_IDS_LIST } from "@/config/landingContent";

export function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerOffset = 100;
      let current = "";
      for (const id of SECTION_IDS_LIST) {
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
