import "server-only";
import { SITE_URL } from "@/src/lib/site";

/* Plantilla HTML de los correos de compra, con el mismo modelo visual de la
   web: encabezado blanco con logo y lema, cinta de ediciones, bloque de color
   de la edición con títulos en mayúsculas, tarjetas cuadradas, títulos de
   sección en teal, botón píldora con borde y pie "¿Listo para abastecerte?".
   Hecha con tablas y estilos en línea (lo que respetan Gmail/Outlook/Apple
   Mail), sobre la estructura base de Resend. */

export interface EmailLine {
  name: string;
  opts: string;
  qty: number;
  total: string;
  /** Ruta de la imagen en /public (se convierte a URL absoluta) */
  image?: string;
  /** Fondo detrás de la foto (color de la edición) */
  bg?: string;
}

export interface EmailBlock {
  heading: string;
  /** Líneas de texto ya escapadas (se permite <strong>) */
  lines: string[];
}

export interface OrderEmailData {
  lang: string;
  /** Texto de vista previa en la bandeja de entrada */
  preheader: string;
  /** Lema bajo el logo ("Del campo al futuro.") */
  tagline: string;
  /** Nombres de las ediciones para la cinta superior */
  ticker: string[];
  /** Bloque de color: como el encabezado de cada edición en la web */
  hero: {
    bg: string;
    color: string;
    kicker: string;
    title: string;
    text: string;
  };
  orderLabel: string;
  orderNumber: string;
  lines: EmailLine[];
  totals: { label: string; value: string; accent?: boolean }[];
  total: { label: string; value: string };
  blocks: EmailBlock[];
  cta?: { label: string; href: string };
  outro?: string;
  /** Pie: frase en amarillo + título grande (como el pie de la web) */
  closing: { kicker: string; title: string; accent: string };
  footer: string;
}

const TEAL = "#116e78";
const YELLOW = "#ffbe30";
const INK = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
/* Futura es la tipografía de la web (disponible en Apple Mail/iOS) */
const FONT =
  "Futura,'Futura PT','Century Gothic','Trebuchet MS',Arial,sans-serif";
const SCRIPT = "'Brush Script MT','Segoe Script',cursive";

/** Id del logo incrustado como adjunto (ver email.ts): no depende de la web */
export const LOGO_CID = "gg-logo";

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

const sectionHeading = (text: string, margin: string) =>
  `<p style="margin:${margin};font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${TEAL}"><span style="display:inline-block;width:24px;height:2px;background:${TEAL};vertical-align:middle;margin-right:8px"></span>${esc(text)}</p>`;

function productRows(lines: EmailLine[]) {
  return lines
    .map(
      (l) => `
<tr>
  <td width="76" valign="top" style="padding:14px 0;border-bottom:1px solid ${LINE}">
    ${
      l.image
        ? `<img src="${abs(l.image)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;background:${l.bg ?? "#f3f4f6"}" />`
        : `<div style="width:64px;height:64px;background:${l.bg ?? "#f3f4f6"}"></div>`
    }
  </td>
  <td valign="middle" style="padding:14px 12px;border-bottom:1px solid ${LINE};font-family:${FONT}">
    <p style="margin:0;font-size:15px;font-weight:700;color:${INK}">${esc(l.name)}</p>
    <p style="margin:3px 0 0;font-size:12px;color:${MUTED}">${esc(l.opts)} · ×${l.qty}</p>
  </td>
  <td valign="middle" align="right" style="padding:14px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:15px;font-weight:700;color:${INK};white-space:nowrap">${esc(l.total)}</td>
</tr>`,
    )
    .join("");
}

function totalRows(data: OrderEmailData) {
  const rows = data.totals
    .map(
      (r) => `
<tr>
  <td style="padding:4px 0;font-family:${FONT};font-size:14px;color:${r.accent ? TEAL : MUTED}">${esc(r.label)}</td>
  <td align="right" style="padding:4px 0;font-family:${FONT};font-size:14px;color:${r.accent ? TEAL : INK}">${esc(r.value)}</td>
</tr>`,
    )
    .join("");
  return `${rows}
<tr>
  <td style="padding:14px 0 0;border-top:2px solid ${INK};font-family:${FONT};font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${INK}">${esc(data.total.label)}</td>
  <td align="right" style="padding:14px 0 0;border-top:2px solid ${INK};font-family:${FONT};font-size:22px;font-weight:800;color:${INK}">${esc(data.total.value)}</td>
</tr>`;
}

function blocks(list: EmailBlock[]) {
  return list
    .map(
      (b) =>
        sectionHeading(b.heading, "28px 0 8px") +
        `<p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.7;color:${INK}">${b.lines.join("<br />")}</p>`,
    )
    .join("");
}

export function renderOrderEmail(data: OrderEmailData) {
  const h = data.hero;
  const cta = data.cta
    ? `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px"><tr><td style="border:1px solid ${TEAL};border-radius:999px"><a href="${esc(data.cta.href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:16px;font-weight:500;color:${TEAL};text-decoration:none;border-radius:999px">${esc(data.cta.label)}&nbsp;&#8599;</a></td></tr></table>`
    : "";
  const outro = data.outro
    ? `<p style="margin:28px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTED}">${esc(data.outro)}</p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="${esc(data.lang)}">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
    <title>${esc(h.title)}</title>
    <style>
      @media (prefers-color-scheme: dark){li::marker{color:#c4c4c4}}
      @media only screen and (max-width:620px){
        .gg-pad{padding-left:20px !important;padding-right:20px !important}
        .gg-hero-title{font-size:32px !important}
        .gg-closing{font-size:28px !important}
      }
    </style>
  </head>
  <body dir="ltr" lang="${esc(data.lang)}" style="margin:0;padding:0;background:#ffffff">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
      ${esc(data.preheader)}
      <div>&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center" style="background:#ffffff">
      <tbody>
        <tr>
          <td dir="ltr" lang="${esc(data.lang)}" align="center" style="margin:0;padding:0">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">
              <tbody>
                <!-- Encabezado: logo + lema (como el header de la web) -->
                <tr>
                  <td class="gg-pad" style="padding:28px 32px 16px">
                    <a href="${SITE_URL}" style="text-decoration:none"><img src="cid:${LOGO_CID}" width="132" alt="Grain &amp; Grains" style="display:block;width:132px;height:auto;border:0" /></a>
                    <p style="margin:2px 0 0 38px;font-family:${SCRIPT};font-style:italic;font-size:15px;color:#155e75">${esc(data.tagline)}</p>
                  </td>
                </tr>
                <!-- Cinta de ediciones (como el ticker bajo el header) -->
                <tr>
                  <td style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};padding:9px 16px;text-align:center;font-family:${FONT};font-size:10px;line-height:1.6;letter-spacing:2.5px;text-transform:uppercase;color:#4b5563">${data.ticker.map(esc).join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</td>
                </tr>
                <!-- Bloque de color de la edición -->
                <tr>
                  <td class="gg-pad" align="center" style="background:${h.bg};padding:48px 32px 44px;text-align:center">
                    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${h.color}">${esc(h.kicker)}</p>
                    <h1 class="gg-hero-title" style="margin:0;font-family:${FONT};font-size:42px;line-height:1.05;font-weight:900;text-transform:uppercase;color:${h.color}">${esc(h.title)}</h1>
                    <p style="margin:16px auto 0;max-width:440px;font-family:${FONT};font-size:16px;line-height:1.5;font-weight:300;color:${h.color}">${esc(h.text)}</p>
                  </td>
                </tr>
                <!-- Detalle del pedido -->
                <tr>
                  <td class="gg-pad" style="padding:36px 32px 8px">
                    ${sectionHeading(data.orderLabel, "0 0 4px")}
                    <p style="margin:0 0 18px;font-family:${FONT};font-size:22px;font-weight:800;color:${INK}">${esc(data.orderNumber)}</p>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid ${LINE}"><tbody>${productRows(data.lines)}</tbody></table>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px"><tbody>${totalRows(data)}</tbody></table>
                    ${blocks(data.blocks)}
                    ${cta}
                    ${outro}
                  </td>
                </tr>
                <!-- Cierre (como el pie de la web) -->
                <tr>
                  <td class="gg-pad" style="padding:44px 32px 8px">
                    <p style="margin:0 0 6px;font-family:${SCRIPT};font-style:italic;font-size:20px;color:${YELLOW}">${esc(data.closing.kicker)}</p>
                    <p class="gg-closing" style="margin:0;font-family:${FONT};font-size:34px;line-height:1.05;font-weight:900;color:${INK}">${esc(data.closing.title)} <span style="color:${TEAL}">${esc(data.closing.accent)}</span></p>
                  </td>
                </tr>
                <!-- Pie -->
                <tr>
                  <td class="gg-pad" style="padding:0 32px 32px">
                    <hr style="width:100%;border:none;border-color:transparent;border-top:1px solid ${LINE};margin:28px 0 0" />
                    <p style="margin:0;padding:0;color:#9ca3af;font-family:${FONT};font-size:12px;line-height:1.7;margin-top:1em;margin-bottom:1em">${data.footer}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}
