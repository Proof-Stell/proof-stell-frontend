"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * IDs of the landing page sections that can be highlighted in the navigation.
 * These must match the `id` attributes on the <section> elements.
 */
export const SECTION_IDS = ["features", "how-it-works", "leaderboard", "testimonials"] as const;

/**
 * Returns the current active section ID based on scroll position.
 *
 * The hook adds a passive scroll listener to track which section is currently
 * visible in the viewport. The active section is determined by finding the
 * section whose top edge is closest to (but not past) the current scroll position.
 *
 * @returns The ID of the currently active section, or an empty string if no
 *          section is active.
 *
 * @example
 * ```tsx
 * function Navbar() {
 *   const activeSection = useActiveSection();
 *   return (
 *     <nav>
 *       {SECTION_IDS.map(id => (
 *         <a key={id} href={`/#${id}`} className={activeSection === id ? 'active' : ''}>
 *           {id}
 *         </a>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 *
 * @remarks
 * - The scroll listener is marked as `{ passive: true }` for optimal performance.
 * - Cleanup automatically removes the listener when the component unmounts.
 * - The hook uses a single effect with proper dependency array `[]` to ensure
 *   exactly one listener is active at any time.
 */
export function useActiveSection(): string {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    // Track if the component is still mounted to prevent state updates after unmount
    let isMounted = true;

    const handleScroll = () => {
      // Skip SSR or if component is unmounted
      if (typeof window === "undefined" || !isMounted) return;

      const scrollY = window.scrollY;
      const headerOffset = 100; // Offset to account for fixed header height

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

      // Only update state if still mounted
      if (isMounted) {
        setActiveSection(current);
      }
    };

    // Initial calculation in case page loads scrolled
    handleScroll();

    // Add the scroll listener with passive option for better scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // CLEANUP: Remove the listener when:
    // - The component unmounts
    // This prevents memory leaks and ensures no listeners accumulate
    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return activeSection;
}

/**
 * A variant of useActiveSection that also provides a manual setter for the
 * active section. Useful when you need to programmatically set the active section
 * (e.g., when clicking a nav link).
 *
 * @returns A tuple of [activeSection, setActiveSection]
 *
 * @example
 * ```tsx
 * function Navbar() {
 *   const [activeSection, setActiveSection] = useActiveSectionWithSetter();
 *
 *   const handleNavClick = (sectionId: string) => {
 *     setActiveSection(sectionId);
 *   };
 *
 *   return (
 *     <nav>
 *       <a onClick={() => handleNavClick('features')}>Features</a>
 *       <span>Active: {activeSection}</span>
 *     </nav>
 *   );
 * }
 * ```
 */
export function useActiveSectionWithSetter(): [string, (section: string) => void] {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    let isMounted = true;

    const handleScroll = () => {
      if (typeof window === "undefined" || !isMounted) return;

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

      if (isMounted) {
        setActiveSection(current);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Custom setter that allows external control of the active section
  const setSection = useCallback((section: string) => {
    if (SECTION_IDS.includes(section as typeof SECTION_IDS[number]) || section === "") {
      setActiveSection(section);
    }
  }, []);

  return [activeSection, setSection];
}
