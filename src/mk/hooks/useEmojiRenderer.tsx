"use client";
import { useEffect, useRef } from 'react';

/**
 * Hook para renderizar emojis estilo Apple en Windows y otros navegadores con soporte limitado
 * Convierte los emojis en imágenes PNG de Apple
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

        // Parsear los emojis en el contenedor con estilo Apple
        if (containerRef.current) {
          // @ts-ignore
          window.twemoji.parse(containerRef.current, {
            callback: function(icon: string, options: any) {
              // Usar CDN de emoji-datasource-apple para los PNG de Apple
              return 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/' + icon + '.png';
            },
            attributes: function() {
              return {
                loading: 'lazy'
              };
            }
          });
        }
      } catch (error) {
        console.warn('Error al cargar emojis:', error);
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
