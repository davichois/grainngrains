import { getTranslations } from "next-intl/server";
import { ContactError, isQuote, parseContact } from "@/src/lib/contact";
import { FOOTER, sendEmail, siteChrome } from "@/src/lib/checkout/email";
import { ensureSiteData } from "@/src/lib/site-data/load";
import { saveMessage } from "@/src/lib/admin/messages-store";
import { esc, renderOrderEmail } from "@/src/lib/checkout/email-template";
import { CONTACT, whatsappUrl } from "@/src/lib/site";

/* Formulario de contacto / cotización → correo a la tienda (responder le
   llega al cliente) + confirmación al cliente, con el diseño de la web. */

/* Anti-spam básico: límite por IP en memoria (5 envíos cada 10 minutos) */
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60_000;
function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const LABELS_ES = {
  general: "Consulta general",
  greenQuote: "Cotización de café verde",
  roastedQuote: "Cotización de café tostado",
  wholesale: "Compra mayorista",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  /* Trampas para bots: campo oculto relleno o envío en menos de 3 s */
  const elapsed = Date.now() - Number(body.startedAt ?? 0);
  if (body.website || !Number.isFinite(elapsed) || elapsed < 3000) {
    return Response.json({ ok: true });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let input;
  try {
    input = parseContact(body);
  } catch (e) {
    if (e instanceof ContactError)
      return Response.json({ error: `invalid_${e.message}` }, { status: 400 });
    throw e;
  }

  /* Contacto del panel (teléfono y correo de los correos) */
  await ensureSiteData();

  /* Queda en la bandeja del panel (si falla la base, igual llega el correo) */
  await saveMessage(input);

  const to = process.env.CONTACT_EMAIL_TO || process.env.ORDERS_EMAIL_TO;
  if (!to) {
    console.error("[contact] falta CONTACT_EMAIL_TO u ORDERS_EMAIL_TO");
    return Response.json({ error: "server" }, { status: 500 });
  }

  const quote = isQuote(input.type);
  const label = LABELS_ES[input.type];
  const lines = (v: string) => esc(v).replace(/\n/g, "<br />");

  /* ── Correo a la tienda (español) ── */
  const chromeEs = await siteChrome("es");
  const storeHtml = renderOrderEmail({
    lang: "es",
    tagline: chromeEs.tagline,
    ticker: chromeEs.ticker,
    closing: chromeEs.closing,
    preheader: `${label} · ${input.name}${input.company ? ` · ${input.company}` : ""}`,
    hero: {
      bg: "#116e78",
      color: "#ffffff",
      kicker: quote ? "Nueva cotización" : "Nuevo mensaje",
      title: input.name,
      text: `${label} desde la web. Responde este correo para contestarle directamente.`,
    },
    blocks: [
      {
        heading: "Contacto",
        lines: [
          `<strong>${esc(input.name)}</strong>`,
          `<a href="mailto:${esc(input.email)}" style="color:#116e78">${esc(input.email)}</a>`,
          ...(input.phone
            ? [
                `<a href="tel:${esc(input.phone.replace(/[^\d+]/g, ""))}" style="color:#116e78">${esc(input.phone)}</a>`,
              ]
            : []),
        ],
      },
      ...(input.company || input.country || input.volume
        ? [
            {
              heading: "Detalle",
              lines: [
                ...(input.company ? [`Empresa: ${esc(input.company)}`] : []),
                ...(input.country ? [`País: ${esc(input.country)}`] : []),
                ...(input.volume
                  ? [`Volumen estimado: ${esc(input.volume)}`]
                  : []),
                `Idioma de la web: ${esc(input.locale)}`,
              ],
            },
          ]
        : []),
      { heading: "Mensaje", lines: [lines(input.message)] },
    ],
    ...(input.phone && {
      cta: {
        label: "Responder por WhatsApp",
        href: `https://wa.me/${input.phone.replace(/\D/g, "")}`,
      },
    }),
    footer: FOOTER,
  });

  const sent = await sendEmail({
    to,
    subject: `[${label}] ${input.name}${input.company ? ` — ${input.company}` : ""}`,
    html: storeHtml,
    replyTo: input.email,
  });
  if (!sent) return Response.json({ error: "server" }, { status: 502 });

  /* ── Confirmación al cliente (en su idioma); si falla no se informa ── */
  try {
    const t = await getTranslations({
      locale: input.locale,
      namespace: "contact",
    });
    const chrome = await siteChrome(input.locale);
    const html = renderOrderEmail({
      lang: input.locale,
      tagline: chrome.tagline,
      ticker: chrome.ticker,
      closing: chrome.closing,
      preheader: t("email.preheader"),
      hero: {
        bg: "#116e78",
        color: "#ffffff",
        kicker: t("email.kicker"),
        title: t("email.title", { name: input.name.split(" ")[0] }),
        text: t("email.text"),
      },
      blocks: [
        { heading: t(`types.${input.type}`), lines: [lines(input.message)] },
        {
          heading: t("email.reach"),
          lines: [
            `<a href="${CONTACT.phoneHref}" style="color:#116e78">${esc(CONTACT.phone)}</a>`,
            `<a href="mailto:${CONTACT.email}" style="color:#116e78">${esc(CONTACT.email)}</a>`,
          ],
        },
      ],
      cta: {
        label: t("email.whatsapp"),
        href: whatsappUrl(t("whatsappMessage")),
      },
      outro: t("email.outro"),
      footer: FOOTER,
    });
    await sendEmail({
      to: input.email,
      subject: t("email.subject"),
      html,
      /* Si el cliente responde, le llega al correo público de la empresa */
      replyTo: CONTACT.email,
    });
  } catch (e) {
    console.error("[contact] confirmación no enviada", e);
  }

  return Response.json({ ok: true });
}
