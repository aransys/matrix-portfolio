import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently closest to the middle of the
 * viewport. Backed by a single IntersectionObserver — no scroll listeners.
 *
 * The `rootMargin` shrinks the observation zone to the middle ~20% of the
 * viewport, so the active section flips as soon as its heading crosses that
 * band (rather than when it becomes merely visible at the bottom).
 */
export function useActiveSection(
  sectionIds: readonly string[],
): string | null {
  const [activeId, setActiveId] = useState<string | null>(
    sectionIds[0] ?? null,
  );

  // Join to a stable string so the effect only re-runs when the list of ids
  // actually changes (array references from .map() would churn otherwise).
  const idsKey = sectionIds.join(",");

  useEffect(() => {
    const ids = idsKey.split(",").filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [idsKey]);

  return activeId;
}
