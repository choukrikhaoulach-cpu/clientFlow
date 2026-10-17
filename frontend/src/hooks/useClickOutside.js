import { useEffect } from "react";

/**
 * Calls `onOutside` when a click/touch happens outside of the given ref's element.
 * Used to close dropdowns (search results, notifications, profile menu) on outside click.
 */
export default function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutside();
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, onOutside]);
}
