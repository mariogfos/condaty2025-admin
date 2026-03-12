import { useEffect } from "react";

export const useOnClickOutside = (ref, handler, ref1 = null, ref2 = null) => {
  useEffect(() => {
    const listener = (event) => {
      if (
        !ref.current ||
        ref.current.contains(event.target) ||
        (ref1 && ref1.current && ref1.current.contains(event.target)) ||
        (ref2 && ref2.current && ref2.current.contains(event.target))
      ) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};
