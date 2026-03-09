import { NextRequest, NextResponse } from "next/server";
import { getGlossaryTranslation } from "@/i18n/glossary";
import { normalizeIdentityDocumentText } from "@/i18n/identity";

export const runtime = "nodejs";

const SEPARATOR = "\n§§§§§§§§§\n";
const MAX_ITEMS_PER_REQUEST = 20;
const MAX_TOTAL_CHARACTERS = 12000;

type TranslateBody = {
  texts?: string[];
  target?: "es" | "pt" | "en";
};

type TranslationCache = Map<string, string>;

declare global {
  // eslint-disable-next-line no-var
  var __condatyTranslationCache: TranslationCache | undefined;
}

const cache = globalThis.__condatyTranslationCache ?? new Map<string, string>();

if (!globalThis.__condatyTranslationCache) {
  globalThis.__condatyTranslationCache = cache;
}

const normalizeText = (value: string) => value.trim();

const translateChunk = async (
  texts: string[],
  target: "es" | "pt" | "en",
): Promise<string[]> => {
  if (target === "es") {
    return texts;
  }

  const query = texts.join(SEPARATOR);
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "CondatyLegacyAdmin/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Translation request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown[];
  const translatedText =
    ((payload?.[0] as unknown[]) ?? [])
      .map((part) => ((part as unknown[])?.[0] as string) ?? "")
      .join("") || query;

  return translatedText.split(SEPARATOR);
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = (rawBody ? JSON.parse(rawBody) : {}) as TranslateBody;
    const target =
      body.target === "pt" || body.target === "en" ? body.target : "es";
    const inputTexts = Array.isArray(body.texts) ? body.texts : [];

    const uniqueTexts = Array.from(
      new Set(
        inputTexts
          .map((value) => (typeof value === "string" ? normalizeText(value) : ""))
          .filter(Boolean),
      ),
    );

    if (uniqueTexts.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    const totalCharacters = uniqueTexts.reduce(
      (total, text) => total + text.length,
      0,
    );

    if (
      uniqueTexts.length > MAX_ITEMS_PER_REQUEST * 5 ||
      totalCharacters > MAX_TOTAL_CHARACTERS
    ) {
      return NextResponse.json(
        { error: "Translation payload too large" },
        { status: 413 },
      );
    }

    const translations: Record<string, string> = {};
    const missingTexts: string[] = [];

    for (const text of uniqueTexts) {
      const glossaryTranslation = getGlossaryTranslation(text, target);
      if (glossaryTranslation) {
        const normalizedGlossaryTranslation = normalizeIdentityDocumentText(
          glossaryTranslation,
          target,
        );
        translations[text] = normalizedGlossaryTranslation;
        cache.set(`${target}:${text}`, normalizedGlossaryTranslation);
        continue;
      }

      const cacheKey = `${target}:${text}`;
      const cachedTranslation = cache.get(cacheKey);

      if (cachedTranslation) {
        translations[text] = normalizeIdentityDocumentText(
          cachedTranslation,
          target,
        );
      } else {
        missingTexts.push(text);
      }
    }

    for (
      let index = 0;
      index < missingTexts.length;
      index += MAX_ITEMS_PER_REQUEST
    ) {
      const chunk = missingTexts.slice(index, index + MAX_ITEMS_PER_REQUEST);
      const chunkTranslations = await translateChunk(chunk, target);

      chunk.forEach((text, chunkIndex) => {
        const translated = normalizeIdentityDocumentText(
          chunkTranslations[chunkIndex] ?? text,
          target,
        );
        translations[text] = translated;
        cache.set(`${target}:${text}`, translated);
      });
    }

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Translation route error", error);

    return NextResponse.json(
      { error: "Unable to translate content" },
      { status: 500 },
    );
  }
}
