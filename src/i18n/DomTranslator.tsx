"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import {
  AppLocale,
  DEFAULT_LOCALE,
  LANGUAGE_CACHE_KEY,
} from "@/i18n/runtime";
import { normalizeIdentityDocumentText } from "@/i18n/identity";
import { useEffect, useRef } from "react";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"]);
const MAX_BATCH_ITEMS = 20;
const MAX_TRANSLATABLE_LENGTH = 1200;
const CACHE_LIMIT = 2500;
const createCacheKey = (locale: AppLocale, text: string) =>
  `${locale}::${text}`;

const splitPadding = (value: string) => {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";

  return {
    leading,
    core: value.slice(leading.length, value.length - trailing.length),
    trailing,
  };
};

const isTranslatable = (value: string) => {
  const text = value.trim();

  if (!text || text.length > MAX_TRANSLATABLE_LENGTH) {
    return false;
  }

  if (!/[A-Za-zÀ-ÿ]/.test(text)) {
    return false;
  }

  return true;
};

const shouldIgnoreElement = (element: Element | null) => {
  if (!element) {
    return true;
  }

  if (SKIP_TAGS.has(element.tagName)) {
    return true;
  }

  if (element.closest("[class*='apexcharts']")) {
    return true;
  }

  return Boolean(element.closest("[data-i18n-ignore='true']"));
};

const toCacheObject = (cache: Map<string, string>) => {
  const trimmedEntries = Array.from(cache.entries()).slice(-CACHE_LIMIT);
  return Object.fromEntries(trimmedEntries);
};

const DomTranslator = () => {
  const { locale, ready } = useLanguage();

  const localeRef = useRef<AppLocale>(locale);
  const observerRef = useRef<MutationObserver | null>(null);
  const isApplyingRef = useRef(false);
  const textOriginalsRef = useRef(new Map<Text, string>());
  const placeholderOriginalsRef = useRef(new Map<Element, string>());
  const placeholderAppliedRef = useRef(new Map<Element, string>());
  const cacheRef = useRef(new Map<string, string>());
  const pendingQueueRef = useRef(
    new Map<string, { locale: AppLocale; text: string }>(),
  );
  const pendingResolversRef = useRef(
    new Map<string, Array<(translation: string) => void>>(),
  );
  const flushTimerRef = useRef<number | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawCache = window.localStorage.getItem(LANGUAGE_CACHE_KEY);
      if (!rawCache) {
        return;
      }

      const parsed = JSON.parse(rawCache) as Record<string, string>;
      cacheRef.current = new Map(Object.entries(parsed));
    } catch (error) {
      console.error("No se pudo cargar la cache de idioma", error);
    }
  }, []);

  const persistCache = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          LANGUAGE_CACHE_KEY,
          JSON.stringify(toCacheObject(cacheRef.current)),
        );
      } catch (error) {
        console.error("No se pudo guardar la cache de idioma", error);
      }
    }, 120);
  };

  const applyTextTranslation = (
    node: Text,
    translation: string,
    targetLocale: AppLocale,
  ) => {
    if (!node.isConnected || localeRef.current !== targetLocale) {
      return;
    }

    const original =
      textOriginalsRef.current.get(node) ?? node.nodeValue ?? translation;
    const { leading, trailing } = splitPadding(original);
    const nextValue = `${leading}${normalizeIdentityDocumentText(
      translation,
      targetLocale,
    )}${trailing}`;

    if (node.nodeValue === nextValue) {
      return;
    }

    isApplyingRef.current = true;
    node.nodeValue = nextValue;
    isApplyingRef.current = false;
  };

  const applyPlaceholderTranslation = (
    element: Element,
    translation: string,
    targetLocale: AppLocale,
  ) => {
    if (!element.isConnected || localeRef.current !== targetLocale) {
      return;
    }

    const original =
      placeholderOriginalsRef.current.get(element) ??
      element.getAttribute("placeholder") ??
      translation;
    const { leading, trailing } = splitPadding(original);
    const nextValue = `${leading}${normalizeIdentityDocumentText(
      translation,
      targetLocale,
    )}${trailing}`;

    if (element.getAttribute("placeholder") === nextValue) {
      return;
    }

    isApplyingRef.current = true;
    placeholderAppliedRef.current.set(element, nextValue);
    element.setAttribute("placeholder", nextValue);
    isApplyingRef.current = false;
  };

  const flushQueue = async () => {
    if (flushTimerRef.current && typeof window !== "undefined") {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const items = Array.from(pendingQueueRef.current.values());
    pendingQueueRef.current.clear();

    if (items.length === 0) {
      return;
    }

    const itemsByLocale = new Map<AppLocale, string[]>();
    for (const item of items) {
      if (item.locale === DEFAULT_LOCALE) {
        continue;
      }

      const currentItems = itemsByLocale.get(item.locale) ?? [];
      currentItems.push(item.text);
      itemsByLocale.set(item.locale, currentItems);
    }

    for (const [targetLocale, localeItems] of itemsByLocale.entries()) {
      const chunks: string[][] = [];
      for (let index = 0; index < localeItems.length; index += MAX_BATCH_ITEMS) {
        chunks.push(localeItems.slice(index, index + MAX_BATCH_ITEMS));
      }

      for (const chunk of chunks) {
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              target: targetLocale,
              texts: chunk,
            }),
          });

          if (!response.ok) {
            throw new Error(`Translation request failed with ${response.status}`);
          }

          const payload = (await response.json()) as {
            translations?: Record<string, string>;
          };

          const translations = payload.translations ?? {};

          for (const text of chunk) {
            const translation = translations[text] ?? text;
            const cacheKey = createCacheKey(targetLocale, text);
            cacheRef.current.set(cacheKey, translation);
            const resolvers = pendingResolversRef.current.get(cacheKey) ?? [];
            pendingResolversRef.current.delete(cacheKey);
            resolvers.forEach((resolve) => resolve(translation));
          }

          persistCache();
        } catch (error) {
          console.error("No se pudo traducir el contenido", error);

          for (const text of chunk) {
            const cacheKey = createCacheKey(targetLocale, text);
            const resolvers = pendingResolversRef.current.get(cacheKey) ?? [];
            pendingResolversRef.current.delete(cacheKey);
            resolvers.forEach((resolve) => resolve(text));
          }
        }
      }
    }
  };

  const requestTranslation = (text: string, targetLocale: AppLocale) => {
    if (targetLocale === DEFAULT_LOCALE) {
      return Promise.resolve(text);
    }

    const cacheKey = createCacheKey(targetLocale, text);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    return new Promise<string>((resolve) => {
      const resolvers = pendingResolversRef.current.get(cacheKey) ?? [];
      pendingResolversRef.current.set(cacheKey, [...resolvers, resolve]);
      pendingQueueRef.current.set(cacheKey, {
        locale: targetLocale,
        text,
      });

      if (typeof window !== "undefined") {
        if (flushTimerRef.current) {
          window.clearTimeout(flushTimerRef.current);
        }

        flushTimerRef.current = window.setTimeout(() => {
          void flushQueue();
        }, 70);
      }
    });
  };

  const translateTextNode = (node: Text, updateOriginal = false) => {
    if (!node.parentElement || shouldIgnoreElement(node.parentElement)) {
      return;
    }

    const currentValue = node.nodeValue ?? "";
    if (!isTranslatable(currentValue)) {
      return;
    }

    if (updateOriginal || !textOriginalsRef.current.has(node)) {
      textOriginalsRef.current.set(node, currentValue);
    }

    const originalValue = textOriginalsRef.current.get(node) ?? currentValue;
    const { core } = splitPadding(originalValue);

    if (!isTranslatable(core)) {
      return;
    }

    const targetLocale = localeRef.current;
    if (targetLocale === DEFAULT_LOCALE) {
      applyTextTranslation(
        node,
        normalizeIdentityDocumentText(core, targetLocale),
        targetLocale,
      );
      return;
    }

    void requestTranslation(core, targetLocale).then((translation) => {
      applyTextTranslation(node, translation, targetLocale);
    });
  };

  const translatePlaceholder = (
    element: Element,
    updateOriginal = false,
  ) => {
    if (shouldIgnoreElement(element)) {
      return;
    }

    const currentValue = element.getAttribute("placeholder");
    if (!isTranslatable(currentValue ?? "")) {
      return;
    }

    if (updateOriginal || !placeholderOriginalsRef.current.has(element)) {
      placeholderOriginalsRef.current.set(element, currentValue ?? "");
    }

    const originalValue =
      placeholderOriginalsRef.current.get(element) ?? currentValue ?? "";
    const { core } = splitPadding(originalValue);

    if (!isTranslatable(core)) {
      return;
    }

    const targetLocale = localeRef.current;
    if (targetLocale === DEFAULT_LOCALE) {
      applyPlaceholderTranslation(
        element,
        normalizeIdentityDocumentText(core, targetLocale),
        targetLocale,
      );
      return;
    }

    void requestTranslation(core, targetLocale).then((translation) => {
      applyPlaceholderTranslation(element, translation, targetLocale);
    });
  };

  const scanNode = (node: Node, updateOriginal = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node as Text, updateOriginal);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as Element;
    if (shouldIgnoreElement(element)) {
      return;
    }

    if (element.hasAttribute("placeholder")) {
      translatePlaceholder(element, updateOriginal);
    }

    element.querySelectorAll("[placeholder]").forEach((placeholderElement) => {
      translatePlaceholder(placeholderElement, updateOriginal);
    });

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
    );

    let current: Node | null = walker.currentNode;
    while (current) {
      if (current.nodeType === Node.TEXT_NODE) {
        translateTextNode(current as Text, updateOriginal);
      }

      current = walker.nextNode();
    }
  };

  const restoreOriginalContent = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    isApplyingRef.current = true;

    for (const [node, originalValue] of textOriginalsRef.current.entries()) {
      if (!node.isConnected) {
        textOriginalsRef.current.delete(node);
        continue;
      }

      node.nodeValue = originalValue;
    }

    for (const [
      element,
      originalValue,
    ] of placeholderOriginalsRef.current.entries()) {
      if (!element.isConnected) {
        placeholderOriginalsRef.current.delete(element);
        continue;
      }

      element.setAttribute("placeholder", originalValue);
    }

    isApplyingRef.current = false;
  };

  useEffect(() => {
    if (!ready || typeof document === "undefined") {
      return;
    }

    restoreOriginalContent();

    scanNode(document.body, true);

    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          const element = mutation.target as Element;
          const currentPlaceholder = element.getAttribute("placeholder");

          if (currentPlaceholder === null) {
            placeholderOriginalsRef.current.delete(element);
            placeholderAppliedRef.current.delete(element);
            continue;
          }

          if (placeholderAppliedRef.current.get(element) === currentPlaceholder) {
            placeholderAppliedRef.current.delete(element);
            continue;
          }

          translatePlaceholder(element, true);
          continue;
        }

        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          textOriginalsRef.current.set(node, node.nodeValue ?? "");
          translateTextNode(node, false);
          continue;
        }

        mutation.addedNodes.forEach((addedNode) => {
          scanNode(addedNode, true);
        });
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder"],
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [locale, ready]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        if (flushTimerRef.current) {
          window.clearTimeout(flushTimerRef.current);
        }

        if (persistTimerRef.current) {
          window.clearTimeout(persistTimerRef.current);
        }
      }
    };
  }, []);

  return null;
};

export default DomTranslator;
