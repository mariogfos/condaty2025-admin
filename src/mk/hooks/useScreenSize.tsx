"use client";
import { useMemo, useSyncExternalStore } from "react";

/** Ancho que se asume en el servidor, donde no hay `window`: escritorio. */
const SERVER_WIDTH = 1201;

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange, { passive: true });
  return () => window.removeEventListener("resize", onChange);
};

const getWidth = () => window.innerWidth;
const getServerWidth = () => SERVER_WIDTH;

/**
 * El ancho de la ventana, leído como store externo.
 *
 * 🔴 Antes era `useState` + `useEffect`: el primer render SIEMPRE decía
 * «escritorio» (`isMobile: false`) aunque el ancho ya se supiera, y el efecto
 * lo corregía con un segundo render y un objeto nuevo. En un celular cada
 * consumidor dibujaba primero la versión de escritorio y después saltaba —y
 * con 16 consumidores, eso es un render de más en cada uno al montar—.
 *
 * Con `useSyncExternalStore` el primer render ya tiene el ancho real, y el
 * objeto sólo cambia de identidad cuando cambia el ancho.
 */
export const useScreenSize = () => {
  const width = useSyncExternalStore(subscribe, getWidth, getServerWidth);

  return useMemo(
    () => ({
      width,
      isMobile: width <= 600,
      isTablet: false,
      isDesktop: width > 600,
    }),
    [width],
  );
};
