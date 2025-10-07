"use client";
import { useEffect, useRef } from 'react';

/**
 * Hook para renderizar emojis usando Twemoji en Windows y otros navegadores con soporte limitado
 * Twemoji convierte los emojis en imágenes SVG de Twitter
 */
export function useEmojiRenderer(dependencies: any[] = []) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Solo cargar Twemoji si estamos en el navegador
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Cargar Twemoji dinámicamente
    const loadTwemoji = async () => {
      try {
        // @ts-ignore
        if (!window.twemoji) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js';
          script.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Parsear los emojis en el contenedor
        if (containerRef.current) {
          // @ts-ignore
          window.twemoji.parse(containerRef.current, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/'
          });
        }
      } catch (error) {
        console.warn('Error al cargar Twemoji:', error);
      }
    };

    loadTwemoji();
  }, dependencies);

  return containerRef;
}

/**
 * Componente wrapper para renderizar emojis automáticamente
 */
export function EmojiText({ 
  children, 
  className = '',
  style = {}
}: { 
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const emojiRef = useEmojiRenderer([children]);

  return (
    <span 
      ref={emojiRef} 
      className={className}
      style={style}
    >
      {children}
    </span>
  );
}
