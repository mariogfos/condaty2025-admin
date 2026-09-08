"use client";
import { useMemo, useSyncExternalStore } from "react";

const DESKTOP_FALLBACK_WIDTH = 1201;

const subscribeToViewport = (onStoreChange: () => void) => {
  window.addEventListener("resize", onStoreChange, { passive: true });
  return () => window.removeEventListener("resize", onStoreChange);
};

const getViewportWidth = () => window.innerWidth;

const getServerViewportWidth = () => DESKTOP_FALLBACK_WIDTH;

export const useScreenSize = () => {
  const width = useSyncExternalStore(
    subscribeToViewport,
    getViewportWidth,
    getServerViewportWidth,
  );

  return useMemo(
    () =>
      ({
        width,
        isMobile: width <= 600,
        isTablet: false,
        isDesktop: width > 600,
      }) as const,
    [width],
  );
};
