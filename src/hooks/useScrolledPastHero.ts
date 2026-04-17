import { useEffect, useState } from "react";

/**
 * Returns `true` once the user has scrolled past ~80% of the first viewport
 * (i.e. the hero is no longer the dominant element on screen).
 *
 * Useful for revealing the sticky nav only after the hero terminal is out of
 * the way.
 */
export function useScrolledPastHero(): boolean {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPast(window.scrollY > window.innerHeight * 0.8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrolledPast;
}
