import { useEffect, useRef, useState } from "react";

// Anime un nombre de 0 jusqu'à `target` (effet "premium" au chargement).
export default function useCountUp(target, { duration = 1200 } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const to = Number(target) || 0;

    // Accessibilité : si l'utilisateur a désactivé les animations, on pose
    // directement la valeur finale (pas de flood de re-renders via rAF).
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(to);
      return undefined;
    }

    let start;

    const tick = (t) => {
      if (start === undefined) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(to * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}
