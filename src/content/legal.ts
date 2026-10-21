/* ───────────────────────────────────────────────────────────────
   Textos legales: privacidad, términos y condiciones, y cookies.
   - Español: versión que rige (Perú).
   - Inglés: traducción; los demás idiomas muestran la versión en inglés.
   BORRADOR: revísalo con un abogado antes de publicarlo como definitivo.
   Al cambiar algo, actualiza UPDATED.
─────────────────────────────────────────────────────────────── */

export type LegalDocId = "privacy" | "terms" | "cookies";

export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

/** Fecha de la última actualización (AAAA-MM-DD) */
export const UPDATED = "2026-10-20";

export const COMPANY = {
  name: "Grain & Grains S.A.C.",
  ruc: "20616226488",
  city: "Lima, Perú",
  email: "tradingna@grainngrains.org",
  phone: "+51 927 645 665",
  site: "grainngrains.org",
};

const C = COMPANY;

const es: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: "Política de privacidad",
    description:
      "Cómo Grain & Grains recopila, usa y protege tus datos personales cuando visitas la web o compras en la tienda.",
    intro: `En ${C.name} (RUC ${C.ruc}) cuidamos tus datos personales. Esta política explica qué datos recopilamos, para qué los usamos, con quién los compartimos y cómo puedes ejercer tus derechos, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales, y su Reglamento.`,
    sections: [
      {
        id: "responsable",
        heading: "1. Responsable del tratamiento",
        blocks: [
          `${C.name}, con RUC ${C.ruc}, domiciliada en ${C.city}, es responsable de los datos que nos proporcionas a través de ${C.site}.`,
          `Para cualquier consulta sobre tus datos escríbenos a ${C.email} o llámanos al ${C.phone}.`,
        ],
      },
      {
        id: "datos",
        heading: "2. Datos que recopilamos",
        blocks: [
          "Cuando compras en la tienda:",
          {
            list: [
              "Datos de contacto: correo electrónico y número de celular.",
              "Datos de entrega: nombres, apellidos, departamento, provincia, distrito, dirección y referencia.",
              "Datos del comprobante: DNI o carné de extranjería (boleta), o RUC y razón social (factura).",
              "Datos del pedido: productos, cantidades, cupones usados, montos y fecha.",
              "Tu preferencia de recibir novedades, si marcas esa casilla.",
            ],
          },
          "Datos de pago: los números de tarjeta y los códigos de Yape los ingresas directamente en los campos seguros de Mercado Pago. Nosotros no vemos ni guardamos tu número de tarjeta, su fecha de vencimiento ni el código de seguridad.",
          "Datos técnicos: idioma elegido y, en la página de pago, un identificador del dispositivo que usa Mercado Pago para prevenir fraudes.",
        ],
      },
      {
        id: "finalidades",
        heading: "3. Para qué usamos tus datos",
        blocks: [
          {
            list: [
              "Procesar tu pedido, cobrarlo y enviártelo.",
              "Emitir la boleta o factura electrónica y cumplir nuestras obligaciones tributarias.",
              "Enviarte la confirmación del pedido y comunicarnos contigo para coordinar la entrega.",
              "Aplicar cupones y promociones, y controlar sus límites de uso.",
              "Prevenir fraudes y proteger la seguridad de los pagos.",
              "Atender tus consultas, reclamos y solicitudes.",
              "Enviarte novedades y ofertas solo si nos diste tu consentimiento; puedes retirarlo cuando quieras.",
            ],
          },
          "Tratamos tus datos porque son necesarios para cumplir el contrato de compra, para cumplir obligaciones legales y, en el caso de las novedades, sobre la base de tu consentimiento.",
        ],
      },
      {
        id: "terceros",
        heading: "4. Con quién compartimos tus datos",
        blocks: [
          "Solo compartimos lo necesario con proveedores que nos ayudan a operar la tienda:",
          {
            list: [
              "Mercado Pago: procesa los pagos con tarjeta y Yape, y aplica controles antifraude.",
              "Resend: envía los correos de confirmación del pedido.",
              "Proveedores de alojamiento web y de base de datos que guardan la información de la tienda.",
              "Empresas de transporte o mensajería, para entregar tu pedido.",
              "Autoridades, cuando una norma o una orden lo exija (por ejemplo, SUNAT).",
            ],
          },
          "Algunos de estos proveedores están fuera del Perú, por lo que puede haber transferencia internacional de datos. Solo trabajamos con proveedores que ofrecen niveles adecuados de protección.",
          "No vendemos ni alquilamos tus datos personales.",
        ],
      },
      {
        id: "conservacion",
        heading: "5. Cuánto tiempo los conservamos",
        blocks: [
          "Conservamos los datos de tus pedidos mientras sean necesarios para atenderte y durante el plazo que exigen las normas tributarias y de protección al consumidor. Los datos para novedades se conservan hasta que retires tu consentimiento.",
          "Para controlar los cupones de uso limitado guardamos tu correo y tu documento en forma cifrada (hash), no en texto legible.",
        ],
      },
      {
        id: "derechos",
        heading: "6. Tus derechos",
        blocks: [
          "Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación y oposición (derechos ARCO), así como revocar tu consentimiento para recibir novedades.",
          `Escríbenos a ${C.email} con tu nombre, una copia de tu documento de identidad y lo que solicitas. Te responderemos dentro de los plazos de ley.`,
          "Si consideras que no atendimos tu solicitud, puedes presentar una reclamación ante la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.",
        ],
      },
      {
        id: "seguridad",
        heading: "7. Seguridad",
        blocks: [
          "Usamos conexiones cifradas (HTTPS), campos de pago seguros de Mercado Pago y acceso restringido a la información. Ningún sistema es infalible, pero trabajamos para proteger tus datos frente a accesos no autorizados, pérdida o alteración.",
        ],
      },
      {
        id: "menores",
        heading: "8. Menores de edad",
        blocks: [
          "La tienda está dirigida a mayores de 18 años. No recopilamos a sabiendas datos de menores de edad.",
        ],
      },
      {
        id: "cambios",
        heading: "9. Cambios en esta política",
        blocks: [
          "Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de actualización.",
        ],
      },
    ],
  },

  terms: {
    title: "Términos y condiciones",
    description:
      "Condiciones de compra en la tienda de Grain & Grains: precios, pagos, envíos, cupones, cambios y devoluciones.",
    intro: `Estos términos regulan el uso de ${C.site} y las compras en su tienda, operada por ${C.name} (RUC ${C.ruc}). Al hacer un pedido aceptas estas condiciones y nuestra política de privacidad.`,
    sections: [
      {
        id: "productos",
        heading: "1. Productos y precios",
        blocks: [
          "Vendemos café de especialidad en bolsas de 250 g y 1 kg, en grano entero o molido (grueso, medio o fino), y combos de varios cafés.",
          "Los precios están en soles (S/) e incluyen los impuestos aplicables. El precio que se cobra es el que figura en el resumen del pedido al momento de pagar.",
          "Las fotos son referenciales. La disponibilidad puede cambiar; si un producto se agota después de tu compra, te ofreceremos un cambio o la devolución de tu dinero.",
        ],
      },
      {
        id: "pedido",
        heading: "2. Cómo se hace un pedido",
        blocks: [
          "Agrega los productos al carrito, completa tus datos de contacto, entrega y comprobante, elige el medio de pago y confirma. Te enviaremos un correo con el detalle y el número de pedido.",
          "El contrato se perfecciona cuando el pago es aprobado. Podemos rechazar o anular pedidos con datos falsos, señales de fraude o errores evidentes de precio, devolviendo íntegramente lo pagado.",
        ],
      },
      {
        id: "pagos",
        heading: "3. Pagos",
        blocks: [
          "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express y Diners Club) y Yape, procesados por Mercado Pago. Los pagos con tarjeta se cobran en una sola cuota.",
          "Tu banco puede pedirte una verificación adicional (3D Secure). Yape tiene límites por operación que dependen de tu app.",
          "Si un pago queda en revisión, te avisaremos por correo cuando se apruebe o se rechace.",
        ],
      },
      {
        id: "envios",
        heading: "4. Envíos",
        blocks: [
          "Hacemos envíos a domicilio a todo el Perú. No hay recojo en tienda.",
          {
            list: [
              "Lima y Callao: S/ 10, de 1 a 3 días hábiles.",
              "Provincias: S/ 20, de 3 a 7 días hábiles.",
              "Envío gratis en pedidos desde S/ 150 (después de descuentos).",
            ],
          },
          "Los plazos se cuentan desde la confirmación del pago y son referenciales. Te contactaremos por celular para coordinar la entrega; si no hay nadie para recibirla, coordinaremos un nuevo intento.",
        ],
      },
      {
        id: "comprobantes",
        heading: "5. Comprobantes de pago",
        blocks: [
          "Emitimos boleta o factura electrónica según lo que elijas al comprar. Para la factura necesitamos un RUC válido y la razón social; no se puede cambiar el tipo de comprobante después de emitido.",
        ],
      },
      {
        id: "cupones",
        heading: "6. Cupones y promociones",
        blocks: [
          "Cada cupón tiene sus propias condiciones (vigencia, compra mínima, productos, límites de uso, entre otras), que se validan al momento de pagar.",
          "Se puede usar un cupón por pedido. Las promociones automáticas pueden sumarse cuando así se indique; si no, se aplica la que más te conviene.",
          "Los cupones no se canjean por dinero, no son transferibles cuando son personales y pueden terminar antes si se agotan sus usos o su presupuesto.",
        ],
      },
      {
        id: "devoluciones",
        heading: "7. Cambios, devoluciones y reembolsos",
        blocks: [
          "El café es un alimento, por eso no aceptamos devoluciones de bolsas abiertas por cambio de opinión.",
          "Si tu pedido llegó dañado, incompleto o con un producto distinto, escríbenos dentro de los 7 días calendario siguientes a la entrega, con tu número de pedido y fotos. Te enviaremos el producto correcto o te devolveremos el dinero.",
          "Los reembolsos se hacen por el mismo medio de pago. El tiempo en que se reflejan depende de tu banco o de Yape.",
        ],
      },
      {
        id: "reclamos",
        heading: "8. Consultas y reclamos",
        blocks: [
          `Puedes escribirnos a ${C.email} o llamarnos al ${C.phone}. Responderemos los reclamos dentro de los plazos que establece el Código de Protección y Defensa del Consumidor (Ley N.° 29571).`,
        ],
      },
      {
        id: "propiedad",
        heading: "9. Propiedad intelectual",
        blocks: [
          "La marca Grain & Grains, los textos, fotos, diseños y demás contenidos de la web nos pertenecen o los usamos con autorización. No pueden copiarse ni usarse sin nuestro permiso.",
        ],
      },
      {
        id: "responsabilidad",
        heading: "10. Uso de la web",
        blocks: [
          "Procuramos que la web funcione sin interrupciones y que la información sea correcta, pero puede haber errores o pausas por mantenimiento. No te pedimos datos de tarjeta fuera de los campos seguros de Mercado Pago.",
        ],
      },
      {
        id: "ley",
        heading: "11. Ley aplicable",
        blocks: [
          "Estos términos se rigen por las leyes del Perú. Cualquier controversia se someterá a las autoridades competentes de Lima, sin perjuicio de tus derechos como consumidor ante el INDECOPI.",
          "Podemos actualizar estos términos; se aplica la versión publicada al momento de tu compra.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de cookies",
    description:
      "Qué cookies y almacenamiento usa la web de Grain & Grains y cómo puedes gestionarlos.",
    intro:
      "Las cookies son pequeños archivos que la web guarda en tu navegador. Aquí te contamos cuáles usamos y para qué. Hoy solo usamos las necesarias para que la web y la tienda funcionen: no usamos cookies de publicidad ni de analítica.",
    sections: [
      {
        id: "usamos",
        heading: "1. Qué usamos",
        blocks: [
          {
            list: [
              "NEXT_LOCALE (cookie propia, necesaria): recuerda el idioma que elegiste. Dura mientras navegas.",
              "gg-cart (almacenamiento local del navegador, necesario): guarda los productos de tu carrito para que no se pierdan al cerrar la página. Se borra al vaciar el carrito o al borrar los datos del sitio.",
              "Mercado Pago (cookies de terceros, necesarias, solo en la página de pago): identifican el dispositivo para prevenir fraudes y procesar el pago de forma segura. Están sujetas a la política de privacidad de Mercado Pago.",
            ],
          },
        ],
      },
      {
        id: "gestionar",
        heading: "2. Cómo gestionarlas",
        blocks: [
          "Como son necesarias, no requieren tu consentimiento previo. Aun así, puedes bloquearlas o borrarlas desde la configuración de tu navegador (Chrome, Safari, Firefox, Edge). Si lo haces, la web puede no recordar tu idioma ni tu carrito, y el pago podría no completarse.",
        ],
      },
      {
        id: "cambios",
        heading: "3. Cambios",
        blocks: [
          "Si más adelante usamos cookies de analítica o publicidad, actualizaremos esta política y te pediremos tu consentimiento antes de activarlas.",
          `Consultas: ${C.email}.`,
        ],
      },
    ],
  },
};

const en: Record<LegalDocId, LegalDoc> = {
  privacy: {
    title: "Privacy policy",
    description:
      "How Grain & Grains collects, uses and protects your personal data when you visit the website or shop in our store.",
    intro: `At ${C.name} (RUC ${C.ruc}) we take care of your personal data. This policy explains what data we collect, why we use it, who we share it with and how you can exercise your rights, in accordance with Peruvian Law No. 29733 on Personal Data Protection and its Regulations.`,
    sections: [
      {
        id: "responsable",
        heading: "1. Data controller",
        blocks: [
          `${C.name}, RUC ${C.ruc}, based in ${C.city}, is responsible for the data you provide through ${C.site}.`,
          `For any question about your data, write to ${C.email} or call ${C.phone}.`,
        ],
      },
      {
        id: "datos",
        heading: "2. Data we collect",
        blocks: [
          "When you buy in the store:",
          {
            list: [
              "Contact details: email address and mobile number.",
              "Delivery details: first and last names, department, province, district, address and reference.",
              "Invoice details: DNI or foreigner ID (receipt), or RUC and company name (invoice).",
              "Order details: products, quantities, coupons used, amounts and date.",
              "Your choice to receive news, if you tick that box.",
            ],
          },
          "Payment data: you enter card numbers and Yape codes directly in Mercado Pago's secure fields. We never see or store your card number, expiry date or security code.",
          "Technical data: your chosen language and, on the payment page, a device identifier that Mercado Pago uses to prevent fraud.",
        ],
      },
      {
        id: "finalidades",
        heading: "3. How we use your data",
        blocks: [
          {
            list: [
              "To process, charge and ship your order.",
              "To issue the electronic receipt or invoice and meet our tax obligations.",
              "To send you the order confirmation and contact you to arrange delivery.",
              "To apply coupons and promotions and enforce their usage limits.",
              "To prevent fraud and keep payments secure.",
              "To answer your questions, complaints and requests.",
              "To send you news and offers only if you consented; you can withdraw consent at any time.",
            ],
          },
          "We process your data because it is necessary to perform the purchase contract, to comply with legal obligations and, for news, based on your consent.",
        ],
      },
      {
        id: "terceros",
        heading: "4. Who we share your data with",
        blocks: [
          "We only share what is necessary with providers that help us run the store:",
          {
            list: [
              "Mercado Pago: processes card and Yape payments and runs anti-fraud checks.",
              "Resend: sends the order confirmation emails.",
              "Web hosting and database providers that store the store's information.",
              "Transport or courier companies, to deliver your order.",
              "Authorities, when required by law or order (e.g., SUNAT).",
            ],
          },
          "Some of these providers are located outside Peru, so your data may be transferred internationally. We only work with providers that offer adequate levels of protection.",
          "We do not sell or rent your personal data.",
        ],
      },
      {
        id: "conservacion",
        heading: "5. How long we keep it",
        blocks: [
          "We keep your order data for as long as needed to serve you and for the periods required by tax and consumer-protection rules. Data for news is kept until you withdraw your consent.",
          "To enforce limited-use coupons we store your email and ID only in encrypted (hashed) form, not as readable text.",
        ],
      },
      {
        id: "derechos",
        heading: "6. Your rights",
        blocks: [
          "You can exercise your rights of access, rectification, cancellation and objection (ARCO rights) at any time, and withdraw your consent to receive news.",
          `Write to ${C.email} with your name, a copy of your ID and your request. We will reply within the legal deadlines.`,
          "If you believe we did not handle your request properly, you can file a complaint with Peru's National Authority for Personal Data Protection (Ministry of Justice and Human Rights).",
        ],
      },
      {
        id: "seguridad",
        heading: "7. Security",
        blocks: [
          "We use encrypted connections (HTTPS), Mercado Pago's secure payment fields and restricted access to information. No system is infallible, but we work to protect your data from unauthorized access, loss or alteration.",
        ],
      },
      {
        id: "menores",
        heading: "8. Minors",
        blocks: [
          "The store is intended for people aged 18 or over. We do not knowingly collect data from minors.",
        ],
      },
      {
        id: "cambios",
        heading: "9. Changes to this policy",
        blocks: [
          "We may update this policy. The current version will always be published on this page with its update date.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms and conditions",
    description:
      "Purchase conditions for the Grain & Grains store: prices, payments, shipping, coupons, exchanges and returns.",
    intro: `These terms govern the use of ${C.site} and purchases in its store, operated by ${C.name} (RUC ${C.ruc}). By placing an order you accept these conditions and our privacy policy. The Spanish version prevails.`,
    sections: [
      {
        id: "productos",
        heading: "1. Products and prices",
        blocks: [
          "We sell specialty coffee in 250 g and 1 kg bags, as whole bean or ground (coarse, medium or fine), and bundles of several coffees.",
          "Prices are in Peruvian soles (S/) and include applicable taxes. The price charged is the one shown in the order summary at the time of payment.",
          "Photos are for reference. Availability may change; if a product runs out after your purchase, we will offer an exchange or a refund.",
        ],
      },
      {
        id: "pedido",
        heading: "2. How to place an order",
        blocks: [
          "Add products to the cart, fill in your contact, delivery and invoice details, choose a payment method and confirm. We will email you the details and the order number.",
          "The contract is formed when the payment is approved. We may reject or cancel orders with false data, signs of fraud or obvious pricing errors, refunding the full amount paid.",
        ],
      },
      {
        id: "pagos",
        heading: "3. Payments",
        blocks: [
          "We accept credit and debit cards (Visa, Mastercard, American Express and Diners Club) and Yape, processed by Mercado Pago. Card payments are charged in a single installment.",
          "Your bank may ask for an additional verification (3D Secure). Yape has per-transaction limits that depend on your app.",
          "If a payment is under review, we will email you when it is approved or rejected.",
        ],
      },
      {
        id: "envios",
        heading: "4. Shipping",
        blocks: [
          "We deliver to homes throughout Peru. There is no in-store pickup.",
          {
            list: [
              "Lima and Callao: S/ 10, 1 to 3 business days.",
              "Provinces: S/ 20, 3 to 7 business days.",
              "Free shipping on orders from S/ 150 (after discounts).",
            ],
          },
          "Delivery times start once payment is confirmed and are estimates. We will contact you by phone to arrange delivery; if nobody is available, we will arrange another attempt.",
        ],
      },
      {
        id: "comprobantes",
        heading: "5. Receipts and invoices",
        blocks: [
          "We issue an electronic receipt (boleta) or invoice (factura) as you choose at checkout. An invoice requires a valid RUC and company name; the document type cannot be changed once issued.",
        ],
      },
      {
        id: "cupones",
        heading: "6. Coupons and promotions",
        blocks: [
          "Each coupon has its own conditions (validity, minimum purchase, products, usage limits, among others), which are checked at payment.",
          "One coupon can be used per order. Automatic promotions may be combined when stated; otherwise, the one that benefits you most is applied.",
          "Coupons cannot be exchanged for cash, are non-transferable when personal, and may end early if their uses or budget run out.",
        ],
      },
      {
        id: "devoluciones",
        heading: "7. Exchanges, returns and refunds",
        blocks: [
          "Coffee is a food product, so we do not accept returns of opened bags because of a change of mind.",
          "If your order arrived damaged, incomplete or with the wrong product, write to us within 7 calendar days of delivery with your order number and photos. We will send the right product or refund your money.",
          "Refunds are made to the same payment method. The time it takes to show depends on your bank or Yape.",
        ],
      },
      {
        id: "reclamos",
        heading: "8. Questions and complaints",
        blocks: [
          `Write to ${C.email} or call ${C.phone}. We answer complaints within the deadlines set by Peru's Consumer Protection and Defense Code (Law No. 29571).`,
        ],
      },
      {
        id: "propiedad",
        heading: "9. Intellectual property",
        blocks: [
          "The Grain & Grains brand, texts, photos, designs and other website content belong to us or are used with permission. They may not be copied or used without our authorization.",
        ],
      },
      {
        id: "responsabilidad",
        heading: "10. Use of the website",
        blocks: [
          "We aim to keep the website running without interruptions and the information accurate, but there may be errors or maintenance pauses. We never ask for card details outside Mercado Pago's secure fields.",
        ],
      },
      {
        id: "ley",
        heading: "11. Governing law",
        blocks: [
          "These terms are governed by the laws of Peru. Any dispute will be submitted to the competent authorities of Lima, without prejudice to your consumer rights before INDECOPI.",
          "We may update these terms; the version published at the time of your purchase applies.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    description:
      "Which cookies and storage the Grain & Grains website uses and how you can manage them.",
    intro:
      "Cookies are small files a website stores in your browser. Here we explain which ones we use and why. Today we only use those needed for the website and store to work: we do not use advertising or analytics cookies.",
    sections: [
      {
        id: "usamos",
        heading: "1. What we use",
        blocks: [
          {
            list: [
              "NEXT_LOCALE (first-party cookie, necessary): remembers the language you chose. Lasts while you browse.",
              "gg-cart (browser local storage, necessary): keeps the products in your cart so they are not lost when you close the page. It is removed when you empty the cart or clear the site's data.",
              "Mercado Pago (third-party cookies, necessary, payment page only): identify the device to prevent fraud and process the payment securely. They are subject to Mercado Pago's privacy policy.",
            ],
          },
        ],
      },
      {
        id: "gestionar",
        heading: "2. How to manage them",
        blocks: [
          "As they are necessary, they do not require your prior consent. Even so, you can block or delete them in your browser settings (Chrome, Safari, Firefox, Edge). If you do, the website may not remember your language or cart, and payment may not complete.",
        ],
      },
      {
        id: "cambios",
        heading: "3. Changes",
        blocks: [
          "If we start using analytics or advertising cookies, we will update this policy and ask for your consent before enabling them.",
          `Questions: ${C.email}.`,
        ],
      },
    ],
  },
};

/** Idiomas con texto propio; el resto usa el inglés */
export const LEGAL_LOCALES = ["es", "en"] as const;

export function legalDoc(locale: string, id: LegalDocId) {
  const lang = (LEGAL_LOCALES as readonly string[]).includes(locale)
    ? (locale as (typeof LEGAL_LOCALES)[number])
    : "en";
  return { doc: (lang === "es" ? es : en)[id], lang };
}
