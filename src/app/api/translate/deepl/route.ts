import { NextRequest, NextResponse } from "next/server";
import { Locale } from "@/lib/localization/locales";

/** Mapeamento dos locales do projeto para os códigos aceitos pela API DeepL */
const DEEPL_TARGET: Record<Locale, string> = {
  en: "EN-US",
  es: "ES",
  fr: "FR",
  de: "DE",
  zh: "ZH",
};

const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL_API_KEY não configurada" }, { status: 500 });
  }

  let body: { texts: string[]; locale: Locale };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { texts, locale } = body;
  const targetLang = DEEPL_TARGET[locale];

  if (!targetLang) {
    return NextResponse.json({ error: `Locale inválido: ${locale}` }, { status: 400 });
  }

  try {
    const response = await fetch(DEEPL_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `DeepL-Auth-Key ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        text:        texts.filter(Boolean), // ignora campos null/undefined
        source_lang: "PT",
        target_lang: targetLang,
        formality:   "default",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `DeepL API error ${response.status}: ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translations: string[] = data.translations.map((t: { text: string }) => t.text);

    return NextResponse.json({ translations });
  } catch (e) {
    return NextResponse.json(
      { error: `Falha na chamada DeepL: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
