"use client";
import { useState, useEffect } from "react";

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1201,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1201,
        isDesktop: width >= 1201,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};
