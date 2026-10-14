import "server-only";
import { getTranslations } from "next-intl/server";
import {
  CATEGORIES,
  COMBO_CATEGORY,
  comboDetails,
  findCombo,
  findProduct,
} from "@/src/components/product-showcase/data";
import { SITE_URL } from "@/src/lib/site";
import type { CheckoutInput, PricedOrder } from "./order";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  LOGO_CID,
  esc,
  renderOrderEmail,
  type EmailLine,
} from "./email-template";

/* Correos del pedido con Resend (API REST, sin SDK):
   - a la tienda (ORDERS_EMAIL_TO), siempre en español, con todos los datos;
   - al cliente, en su idioma, como confirmación. */

const money = (n: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    n,
  );

const FOOTER = `Grain &amp; Grains S.A.C. · RUC 20616226488<br />Lima, Perú · +51 930 625 619 · <a href="${SITE_URL}" style="color:#898989">grainngrains.org</a>`;

/* Logo incrustado en el correo (cid:gg-logo): se ve aunque la imagen no esté
   publicada en la web y no lo bloquean los clientes que ocultan imágenes remotas */
let logoBase64: Promise<string> | null = null;
const logo = () =>
  (logoBase64 ??= readFile(
    path.join(process.cwd(), "public/images/email/logo.png"),
  ).then((b) => b.toString("base64")));

async function send(
  to: string,
  subject: string,
  html: string,
  replyTo?: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDERS_EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY u ORDERS_EMAIL_FROM no configurados; no se envió:",
      subject,
    );
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "grainngrains-logo.png",
          content: await logo(),
          content_type: "image/png",
          content_id: LOGO_CID,
        },
      ],
      ...(replyTo && { reply_to: replyTo }),
    }),
  });
  if (!res.ok)
    console.error("[email] Resend respondió", res.status, await res.text());
}

/** Productos del pedido con nombre, opciones, foto y color en el idioma pedido */
async function emailLines(priced: PricedOrder, locale: string) {
  const t = await getTranslations({ locale });
  return priced.lines.map((l): EmailLine => {
    const isCombo = l.categoryId === COMBO_CATEGORY;
    const combo = isCombo ? findCombo(l.productId) : undefined;
    const first = combo ? comboDetails(combo).products[0] : undefined;
    const category = CATEGORIES.find((c) => c.id === l.categoryId);
    const product = findProduct(l.categoryId, l.productId);
    return {
      name: isCombo
        ? t(`cart.combos.${l.productId}.name`)
        : t(`editions.${l.categoryId}.products.${l.productId}`),
      opts: `${t(`shop.sizes.${l.size}`)}${isCombo ? ` ${t("shop.each")}` : ""} · ${t(`shop.grinds.${l.grind}`)}`,
      qty: l.qty,
      total: money(l.lineTotal),
      image: first?.product.image ?? product?.image,
      bg: first?.bg ?? product?.cardBg ?? category?.color,
    };
  });
}

/** Elementos comunes con la web: lema, cinta de ediciones, cierre y colores */
async function siteChrome(locale: string, priced: PricedOrder) {
  const t = await getTranslations({ locale });
  /* El bloque de color usa la edición del primer café del pedido */
  const first = priced.lines[0];
  const combo =
    first?.categoryId === COMBO_CATEGORY
      ? findCombo(first.productId)
      : undefined;
  const categoryId = combo ? combo.items[0]?.categoryId : first?.categoryId;
  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  return {
    tagline: t("nav.farmToFuture"),
    ticker: CATEGORIES.map((c) => t(`editions.${c.id}.name`)),
    heroColors: {
      bg: category.panelBg,
      color: category.headingColor ?? "#FFF0B4",
    },
    closing: {
      kicker: t("CTA.title"),
      title: t("CTA.subtitle"),
      accent: t("CTA.together"),
    },
  };
}

function totals(
  priced: PricedOrder,
  labels: {
    subtotal: string;
    discount: string;
    shipping: string;
    free: string;
  },
) {
  return [
    { label: labels.subtotal, value: money(priced.subtotal) },
    ...(priced.discountAmount > 0
      ? [
          {
            label: `${labels.discount} (−${priced.discountPercent}%)`,
            value: `−${money(priced.discountAmount)}`,
            accent: true,
          },
        ]
      : []),
    {
      label: labels.shipping,
      value: priced.shipping === 0 ? labels.free : money(priced.shipping),
      accent: priced.shipping === 0,
    },
  ];
}

interface OrderEmail {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Arma los correos del pedido (tienda + cliente) sin enviarlos */
export async function buildOrderEmails({
  input,
  priced,
  orderNumber,
  chargeId,
}: {
  input: CheckoutInput;
  priced: PricedOrder;
  orderNumber: string;
  chargeId: string;
}): Promise<OrderEmail[]> {
  const emails: OrderEmail[] = [];
  const { customer: c, address: a, receipt: r } = input;
  const addressLines = [
    esc(a.address),
    `${esc(a.district)}, ${esc(a.province)}, ${esc(a.department)}`,
    ...(a.reference ? [`Ref.: ${esc(a.reference)}`] : []),
  ];

  /* ── Correo a la tienda (español, con todos los datos) ── */
  const storeTo = process.env.ORDERS_EMAIL_TO;
  if (storeTo) {
    const chrome = await siteChrome("es", priced);
    const html = renderOrderEmail({
      lang: "es",
      tagline: chrome.tagline,
      ticker: chrome.ticker,
      closing: chrome.closing,
      preheader: `${c.firstName} ${c.lastName} · ${money(priced.total)} · ${input.payment === "wallet" ? "Yape" : "Tarjeta"}`,
      hero: {
        ...chrome.heroColors,
        kicker: "Nuevo pedido pagado",
        title: `${c.firstName} ${c.lastName}`,
        text: `Pago con ${input.payment === "wallet" ? "Yape" : "tarjeta"} aprobado por Mercado Pago (operación ${chargeId}). Prepara el envío y coordina la entrega con el cliente.`,
      },
      orderLabel: "Pedido",
      orderNumber,
      lines: await emailLines(priced, "es"),
      totals: totals(priced, {
        subtotal: "Subtotal",
        discount: `Descuento ${input.discountCode ?? ""}`.trim(),
        shipping: "Envío",
        free: "Gratis",
      }),
      total: { label: "Total cobrado", value: money(priced.total) },
      blocks: [
        {
          heading: "Cliente",
          lines: [
            `<strong>${esc(c.firstName)} ${esc(c.lastName)}</strong>`,
            esc(c.email),
            `+51 ${esc(c.phone)}`,
            ...(c.newsletter ? ["Acepta recibir novedades"] : []),
          ],
        },
        { heading: "Entrega", lines: addressLines },
        {
          heading: "Comprobante",
          lines:
            r.type === "boleta"
              ? [`Boleta · DNI/CE ${esc(r.document)}`]
              : [`Factura · RUC ${esc(r.ruc)}`, esc(r.businessName)],
        },
      ],
      footer: FOOTER,
    });
    emails.push({
      to: storeTo,
      subject: `Nuevo pedido ${orderNumber} · ${money(priced.total)}`,
      html,
      replyTo: c.email,
    });
  }

  /* ── Confirmación al cliente (en su idioma) ── */
  const t = await getTranslations({
    locale: input.locale,
    namespace: "orderEmail",
  });
  const chrome = await siteChrome(input.locale, priced);
  const html = renderOrderEmail({
    lang: input.locale,
    tagline: chrome.tagline,
    ticker: chrome.ticker,
    closing: chrome.closing,
    preheader: t("preheader", { order: orderNumber }),
    hero: {
      ...chrome.heroColors,
      kicker: t("heroKicker"),
      title: t("title", { name: c.firstName }),
      text: t("heroText"),
    },
    orderLabel: t("orderLabel"),
    orderNumber,
    lines: await emailLines(priced, input.locale),
    totals: totals(priced, {
      subtotal: t("subtotal"),
      discount: t("discount"),
      shipping: t("shipping"),
      free: t("free"),
    }),
    total: { label: t("total"), value: money(priced.total) },
    blocks: [
      { heading: t("deliveryTo"), lines: addressLines },
      {
        heading: t("paymentLabel"),
        lines: [input.payment === "wallet" ? "Yape" : t("paidCard")],
      },
    ],
    cta: {
      label: t("cta"),
      href: `${SITE_URL}/${input.locale}/our-coffee/products`,
    },
    outro: t("outro"),
    footer: FOOTER,
  });
  emails.push({
    to: c.email,
    subject: t("subject", { order: orderNumber }),
    html,
  });
  return emails;
}

export async function sendOrderEmails(
  params: Parameters<typeof buildOrderEmails>[0],
) {
  for (const e of await buildOrderEmails(params)) {
    await send(e.to, e.subject, e.html, e.replyTo);
  }
}
