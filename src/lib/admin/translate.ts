import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* ───────────────────────────────────────────────────────────────
   Traducción automática con Claude (ANTHROPIC_API_KEY en el .env).
   Recibe los textos en español de un formulario y devuelve cada uno en
   los demás idiomas de la web, como JSON validado con un esquema.
─────────────────────────────────────────────────────────────── */

export const canTranslate = () => Boolean(process.env.ANTHROPIC_API_KEY);

export type TranslateField = { key: string; text: string; hint: string };

const LANGUAGE: Record<string, string> = {
  en: "English",
  de: "German",
  fr: "French",
  pt: "Portuguese (Brazil)",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ko: "Korean",
};

const SYSTEM = `You translate short texts for the online store of Grain & Grains, a Peruvian specialty coffee brand (fair trade, organic, made with smallholder farmers and women coffee growers).
Rules:
- Translate from Spanish into each requested language with the natural wording a native speaker would see in a premium coffee shop.
- Keep proper names as they are: people, farms (e.g. "Don Eliseo"), places, the brand "Grain & Grains", and coffee varietal names (Geisha, Bourbon, Caturra, Typica…) unless the language has a standard spelling for them.
- Keep units and numbers as written (250 g, 1 kg).
- If the Spanish text is in UPPERCASE, the translation must be in UPPERCASE too (for Chinese, Japanese and Korean simply use the normal script).
- Respect each field's hint about what the text is and keep a similar length.
- Return only the translations, with no notes.`;

export async function translateTexts(fields: TranslateField[], locales: string[]) {
  const client = new Anthropic();
  const keys = fields.map((f) => f.key);
  const perLocale = {
    type: "object",
    properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])),
    required: keys,
    additionalProperties: false,
  };
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: Object.fromEntries(locales.map((l) => [l, perLocale])),
          required: locales,
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `Languages (JSON key → language): ${locales.map((l) => `${l} = ${LANGUAGE[l] ?? l}`).join("; ")}.

Texts in Spanish (JSON key → hint → text):
${fields.map((f) => `- ${f.key} → ${f.hint} → ${JSON.stringify(f.text)}`).join("\n")}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("Claude no quiso traducir este texto.");
  if (response.stop_reason === "max_tokens") throw new Error("La traducción quedó incompleta. Intenta de nuevo.");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const data = JSON.parse(text) as Record<string, Record<string, string>>;
  /* Solo lo pedido, recortado como el formulario */
  return Object.fromEntries(
    locales.map((l) => [l, Object.fromEntries(keys.map((k) => [k, String(data[l]?.[k] ?? "").trim()]))]),
  ) as Record<string, Record<string, string>>;
}
