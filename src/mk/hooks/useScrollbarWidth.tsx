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
    setTimeout(() => {
      calculateScrollbarWidth();
    }, 10);

    window.addEventListener("resize", calculateScrollbarWidth);
    return () => window.removeEventListener("resize", calculateScrollbarWidth);
  }, [calculateScrollbarWidth, ref]);

  return scrollbarWidth;
};

export default useScrollbarWidth;
