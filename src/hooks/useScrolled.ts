import { useState, useEffect } from "react";

export function useScrolled(threshold: number = 20): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleScroll = () => {
      if (isMounted) setScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      isMounted = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return scrolled;
}
