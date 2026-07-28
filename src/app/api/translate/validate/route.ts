import { NextRequest, NextResponse } from "next/server";
import { Locale } from "@/lib/localization/locales";
import { buildGlossaryPrompt } from "@/lib/localization/glossary";

interface TranslationFields {
  name:         string;
  subtitle:     string;
  ability_text: string;
  flavor_text:  string | null;
}

interface ValidationResult {
  name:         string;
  subtitle:     string;
  ability_text: string;
  flavor_text:  string | null;
  confidence:   number;
  notes:        string;
}

function buildPrompt(
  pt:     TranslationFields,
  deepl:  TranslationFields,
  locale: Locale
): string {
  return `Você é um revisor especializado em localização de jogos de tabuleiro.

${buildGlossaryPrompt(locale)}

CONTEXTO DO JOGO:
Solis é um eurogame competitivo sobre megacorporações interestelares construindo Esferas de Dyson.
Tom: científico, corporativo e épico. Sem combate direto. Foco em gestão de recursos e tecnologia.

TAREFA:
Você recebeu a tradução automática (DeepL) de uma carta para ${locale.toUpperCase()}.
Corrija APENAS o necessário para:
1. Aplicar o glossário oficial (termos do jogo devem ser exatos e consistentes)
2. Manter o tom corporativo e científico
3. Preservar o significado mecânico exato das habilidades — jogadores precisam entender
   exatamente o que a carta faz para jogar corretamente

NÃO reescreva do zero. Faça ajustes cirúrgicos onde o DeepL errou terminologia ou tom.

CARTA ORIGINAL (Português):
Nome: ${pt.name}
Subtítulo: ${pt.subtitle}
Habilidade: ${pt.ability_text}
Flavor: ${pt.flavor_text ?? "—"}

TRADUÇÃO DEEPL (${locale.toUpperCase()}):
Nome: ${deepl.name}
Subtítulo: ${deepl.subtitle}
Habilidade: ${deepl.ability_text}
Flavor: ${deepl.flavor_text ?? "—"}

Responda APENAS em JSON válido, sem markdown, sem explicação fora do JSON:
{
  "name": "nome corrigido",
  "subtitle": "subtítulo corrigido",
  "ability_text": "habilidade corrigida",
  "flavor_text": "flavor corrigido ou null se não há flavor",
  "confidence": 0.95,
  "notes": "descrição breve das correções ou 'sem alterações necessárias'"
}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 });
  }

  let body: { pt: TranslationFields; deepl: TranslationFields; locale: Locale };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { pt, deepl, locale } = body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 1000,
        messages:   [{ role: "user", content: buildPrompt(pt, deepl, locale) }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API error ${response.status}: ${err}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content[0]?.text ?? "{}";

    let result: ValidationResult;
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json(
        { error: "Claude retornou JSON inválido", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: `Falha na chamada Claude: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
