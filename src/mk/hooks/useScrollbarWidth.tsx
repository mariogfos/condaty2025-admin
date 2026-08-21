import { useState, useEffect, useCallback } from "react";

const useScrollbarWidth = (ref: any) => {
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const calculateScrollbarWidth = useCallback(() => {
    if (ref.current) {
      const fullWidth = ref.current.offsetWidth;
      const contentWidth = ref.current.clientWidth;
      setScrollbarWidth(fullWidth - contentWidth);
    }
  }, [ref]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const scheduleCalculation = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(calculateScrollbarWidth);
    };

    scheduleCalculation();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleCalculation)
        : null;
    resizeObserver?.observe(element);

    const mutationObserver =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(scheduleCalculation)
        : null;
    mutationObserver?.observe(element, { childList: true, subtree: true });

    window.addEventListener("resize", scheduleCalculation);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", scheduleCalculation);
    };
  }, [calculateScrollbarWidth, ref]);

  return scrollbarWidth;
};

export default useScrollbarWidth;
