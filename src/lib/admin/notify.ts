import "server-only";
import { getTranslations } from "next-intl/server";
import { FOOTER, sendEmail, siteChrome } from "@/src/lib/checkout/email";
import { esc, renderOrderEmail } from "@/src/lib/checkout/email-template";
import { routing } from "@/src/i18n/routing";
import type { OrderRow } from "./orders-store";

/** Correo al cliente: "Tu pedido va en camino" (en el idioma en que compró) */
export async function sendShippedEmail(order: OrderRow) {
  const locale = (routing.locales as readonly string[]).includes(order.locale ?? "")
    ? order.locale!
    : "es";
  const t = await getTranslations({ locale, namespace: "orderShipped" });
  const chrome = await siteChrome(locale);
  const a = order.address;
  const html = renderOrderEmail({
    lang: locale,
    preheader: t("preheader"),
    tagline: chrome.tagline,
    ticker: chrome.ticker,
    closing: chrome.closing,
    hero: {
      bg: "#116e78",
      color: "#ffffff",
      kicker: t("kicker"),
      title: t("title"),
      text: esc(t("text", { number: order.number })),
    },
    blocks: [
      ...(order.carrier || order.tracking_code
        ? [
            {
              heading: t("shipping"),
              lines: [
                ...(order.carrier ? [esc(t("carrier", { carrier: order.carrier }))] : []),
                ...(order.tracking_code
                  ? [`<strong>${esc(t("tracking", { code: order.tracking_code }))}</strong>`]
                  : []),
              ],
            },
          ]
        : []),
      {
        heading: t("address"),
        lines: [
          esc(a.address),
          esc([a.district, a.province, a.department].filter(Boolean).join(", ")),
        ],
      },
    ],
    footer: FOOTER,
  });
  return sendEmail(
    {
      to: order.customer.email,
      subject: t("subject", { number: order.number }),
      html,
    },
    `order/${order.number}/shipped/${order.tracking_code ?? ""}`,
  );
}
