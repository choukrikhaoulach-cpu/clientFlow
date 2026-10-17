import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 up to `target` whenever `target` changes.
 * Used for the animated stat cards on the dashboard.
 */
export default function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const frame = useRef();
  const startTime = useRef();

  useEffect(() => {
    const safeTarget = Number(target) || 0;
    startTime.current = null;

    function step(timestamp) {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(safeTarget * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setValue(safeTarget);
      }
    }

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}
