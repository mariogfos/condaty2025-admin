"use client";
import { useState, useEffect } from "react";

const useScreenSize = () => {
  const [screenWidth, setWidth] = useState(window.innerWidth);
  const [screenHeight, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    let timeoutId: any = null;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
      }, 10);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    screenWidth,
    screenHeight,
    isMobile: screenWidth <= 480,
    isTablet: screenWidth <= 1000,
    isDesktop: screenWidth > 1000,
  };
};

export default useScreenSize;
